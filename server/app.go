package server

import (
	"encoding/json"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/expvar"
	"github.com/gofiber/fiber/v2/middleware/pprof"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/monitor"
	"github.com/dhcmrlchtdj/feedbox/internal/sign"
	"github.com/dhcmrlchtdj/feedbox/server/handler"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/cookie"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/github"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/etag"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/logger"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/secure"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/validate"
	"github.com/dhcmrlchtdj/feedbox/server/typing"
)

func Create() *fiber.App {
	appConfig := fiber.Config{
		// Prefork:       true,
		// Immutable:     true,
		// BodyLimit:     4 * 1024 * 1024,
		ErrorHandler:  errorHandler,
		StrictRouting: true,
		CaseSensitive: true,
		// ProxyHeader:   "CF-Connecting-IP",
	}
	app := fiber.New(appConfig)

	setupMiddleware(app)
	setupRoute(app)

	return app
}

func setupMiddleware(app *fiber.App) {
	prod := os.Getenv("ENV") == "prod"

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(etag.New())
	app.Use(secure.New())

	if !prod {
		app.Use(pprof.New())
		app.Use(expvar.New())
	}
}

func setupRoute(app *fiber.App) {
	app.Use(
		"/api/v1",
		cookie.New(cookie.Config{
			Name:      "token",
			Validator: cookieValidator,
		}))
	app.Get("/api/v1/user", handler.UserInfo)
	app.Get("/api/v1/feeds", handler.FeedList)
	app.Put("/api/v1/feeds/add", validate.ContentType("application/json"), handler.FeedAdd)
	app.Delete("/api/v1/feeds/remove", validate.ContentType("application/json"), handler.FeedRemove)
	app.Get("/api/v1/feeds/export", handler.FeedExport)
	app.Post("/api/v1/feeds/import", validate.ContentType("multipart/form-data"), handler.FeedImport)

	app.Get("/api/logout", handler.Logout)
	app.Get(
		"/api/connect/github",
		github.New(github.Config{
			ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
			ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		}),
		handler.ConnectGithub)

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
	notCare := fiber.DefaultErrorHandler(c, err)
	code := c.Response().StatusCode()
	if code >= 500 {
		monitor.C.Error(err)
	}
	return notCare
}

func cookieValidator(tokenStr string) ( /* Credential */ interface{}, error) {
	plaintext, err := sign.S.DecodeFromBase64(tokenStr)
	if err != nil {
		return nil, errors.Wrap(err, "invalid token")
	}
	var credential typing.Credential
	if err := json.Unmarshal(plaintext, &credential); err != nil {
		return nil, errors.Wrap(err, "invalid token")
	}
	if time.Now().Unix() > credential.ExpiresAt {
		return nil, errors.New("expired token")
	}

	if _, err = database.C.GetUserByID(credential.UserID); err != nil {
		if errors.Is(err, database.ErrEmptyRow) {
			err = errors.New("invalid user")
		}
		return nil, err
	}

	return credential, nil
}
