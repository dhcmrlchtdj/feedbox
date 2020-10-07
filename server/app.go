package server

import (
	"encoding/json"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/expvar"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/pprof"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/global"
	"github.com/dhcmrlchtdj/feedbox/internal/telegrambot"
	"github.com/dhcmrlchtdj/feedbox/server/handler"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/cookie"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/github"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/validate"
	"github.com/dhcmrlchtdj/feedbox/server/typing"
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
			Validator: cookieValidator,
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
		handler.ConnectGithub)

	app.Post(
		"/webhook/telegram/"+telegrambot.HookPath,
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
			global.Monitor.Error(err)
		}
	} else {
		global.Monitor.Error(err)
	}
	return c.Status(code).SendString(err.Error())
}

func cookieValidator(tokenStr string) ( /* *Credential */ interface{}, error) {
	plaintext, err := global.Sign.DecodeFromBase64(tokenStr)
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
