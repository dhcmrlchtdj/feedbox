package server

import (
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"log"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/expvar"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/pprof"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/pkg/errors"
	"golang.org/x/crypto/chacha20poly1305"

	"github.com/dhcmrlchtdj/feedbox/server/handler"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/cookie"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/github"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/validate"
	"github.com/dhcmrlchtdj/feedbox/server/typing"
	"github.com/dhcmrlchtdj/feedbox/service/monitor"
)

func Create() *fiber.App {
	prod := os.Getenv("ENV") == "prod"

	appConfig := fiber.Config{
		// Prefork:       true,
		// Immutable:     true,
		// BodyLimit:     4 * 1024 * 1024,
		ErrorHandler:  errorHandler,
		StrictRouting: true,
		CaseSensitive: true,
		ETag:          true,
	}
	if prod {
		appConfig.ProxyHeader = "CF-Connecting-IP"
	}
	app := fiber.New(appConfig)

	setupMiddleware(app)
	setupRoute(app)

	return app
}

func setupMiddleware(app *fiber.App) {
	prod := os.Getenv("ENV") == "prod"

	app.Use(recover.New())
	// app.Use(requestid.New())

	format := loggerFormat
	if prod {
		format = strings.NewReplacer("\n", "", "\t", "").Replace(format) + "\n"
	}
	app.Use(logger.New(logger.Config{
		Format:     format,
		TimeZone:   "UTC",
		TimeFormat: time.RFC3339,
	}))

	if !prod {
		app.Use(pprof.New())
		app.Use(expvar.New())
	}
}

func setupRoute(app *fiber.App) {
	api := app.Group(
		"/api/v1",
		cookie.New(cookie.Config{
			Name:      "token",
			Validator: aeadValidator(os.Getenv("COOKIE_SECRET")),
		}))
	api.Get("/user", handler.UserInfo)
	api.Get("/feeds", handler.FeedList)
	api.Put("/feeds/add", validate.ContentType("application/json"), handler.FeedAdd)
	api.Delete("/feeds/remove", validate.ContentType("application/json"), handler.FeedRemove)
	api.Get("/feeds/export", handler.FeedExport)
	api.Post("/feeds/import", validate.ContentType("multipart/form-data"), handler.FeedImport)

	app.Get("/api/logout", handler.Logout)
	app.Get(
		"/api/connect/github",
		github.New(github.Config{
			ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
			ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		}),
		handler.ConnectGithub(os.Getenv("COOKIE_SECRET")))

	app.Post(
		"/webhook/telegram/"+os.Getenv("TELEGRAM_WEBHOOK_PATH"),
		validate.ContentType("application/json"),
		handler.TelegramWebhook)

	app.Get("/", handler.StaticWithoutCache("./frontend/_build/index.html"))
	app.Get("/sw.js", handler.StaticWithoutCache("./frontend/_build/sw.js"))
	app.Get("/sw.js.map", handler.StaticWithoutCache("./frontend/_build/sw.js.map"))
	app.Get("/robots.txt", handler.StaticRobots)
	app.Get("/favicon.ico", handler.StaticFavicon)
	app.Get("/:filename", handler.StaticWithCache("./frontend/_build/"))

	if os.Getenv("ENV") == "dev" {
		app.Get("/parse/*", handler.HelperParseFeed)
	}
}

func errorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	var e *fiber.Error
	if errors.As(err, &e) {
		code = e.Code
		if code != fiber.StatusUnauthorized {
			monitor.Client.Error(err)
		}
	} else {
		monitor.Client.Error(err)
	}
	return c.Status(code).SendString(err.Error())
}

func aeadValidator(cookieSecret string) func(string) ( /* *Credential */ interface{}, error) {
	key, err := hex.DecodeString(cookieSecret)
	if err != nil {
		log.Fatalln(err)
	}
	aead, err := chacha20poly1305.NewX(key)
	if err != nil {
		log.Fatalln(err)
	}

	return func(tokenStr string) (interface{}, error) {
		token, err := base64.StdEncoding.DecodeString(tokenStr)
		if err != nil {
			return nil, err
		}

		nonce, ciphertext := token[:aead.NonceSize()], token[aead.NonceSize():]
		plaintext, err := aead.Open(nil, nonce, ciphertext, nil)
		if err != nil {
			return nil, errors.Wrap(err, "invalid token")
		}

		credential := typing.Credential{}
		err = json.Unmarshal(plaintext, &credential)
		if err != nil {
			return nil, errors.Wrap(err, "invalid token")
		}
		if time.Now().Unix() > credential.ExpiresAt {
			return nil, errors.New("expired token")
		}
		return credential, nil
	}
}

var loggerFormat = `{
	"time": "${time}",
	"latency": "${latency}",
	"method": "${method}",
	"path": "${path}",
	"status": ${status},
	"bytes": ${bytesSent},
	"request_id": "${header:x-request-id}",
	"cf_ray": "${header:cf-ray}",
	"ip": "${ip}",
	"ua": "${ua}",
	"referer": "${referer}"
}
`
