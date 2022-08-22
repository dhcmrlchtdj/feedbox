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
	"github.com/dhcmrlchtdj/feedbox/server/types"
)

func Create() *fiber.App {
	appConfig := fiber.Config{
		// BodyLimit: 4 * 1024 * 1024,
		// Concurrency: 256 * 1024,
		ErrorHandler:  errorHandler,
		StrictRouting: true,
		CaseSensitive: true,
		// ProxyHeader: "CF-Connecting-IP",
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
	app.Use("/api/v1", cookie.New(cookie.Config{
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
		handler.ConnectGithub,
	)

	if os.Getenv("ENV") == "dev" {
		app.Get("/helper/preview/*", handler.HelperParseFeed)
	}

	app.Post(
		"/webhook/telegram/"+os.Getenv("TELEGRAM_WEBHOOK_PATH"),
		validate.ContentType("application/json"),
		handler.TelegramWebhook,
	)

	app.Get("/", handler.StaticFile("_build/index.html", handler.StaticWithCustomHeader("_build/index.html.json")))
	app.Get("/sw.js", handler.StaticFile("_build/sw.js"))
	app.Get("/sw.js.map", handler.StaticFile("_build/sw.js.map"))
	app.Get("/favicon.ico", handler.StaticFile("_build/favicon.svg", handler.StaticWithMaxAge(60*60*24*7)))
	app.Get("/:filename", handler.StaticDir("_build/", handler.StaticWithMaxAge(60*60*24*7)))
}

func errorHandler(c *fiber.Ctx, err error) error {
	notCare := fiber.DefaultErrorHandler(c, err)
	code := c.Response().StatusCode()
	if code >= 500 {
		monitor.C.Error(err)
	}
	return notCare
}

func cookieValidator(tokenStr string) ( /* Credential */ any, error) {
	plaintext, err := sign.S.DecodeFromHex(tokenStr)
	if err != nil {
		return nil, errors.Wrap(err, "invalid token")
	}
	var credential types.Credential
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
