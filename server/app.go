package server

import (
	"context"
	"encoding/json"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/expvar"
	"github.com/gofiber/fiber/v2/middleware/pprof"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"
	"github.com/pkg/errors"
	"github.com/rs/zerolog"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/global"
	"github.com/dhcmrlchtdj/feedbox/server/handler"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/cookie"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/github"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/etag"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/logger"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/secure"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/validate"
	"github.com/dhcmrlchtdj/feedbox/server/types"
)

func Create(ctx context.Context) *fiber.App {
	appConfig := fiber.Config{
		DisableStartupMessage: true,
		// BodyLimit: 4 * 1024 * 1024,
		// Concurrency: 256 * 1024,
		ErrorHandler:  errorHandler,
		StrictRouting: true,
		CaseSensitive: true,
		// ProxyHeader: "X-Forwarded-For"
	}
	app := fiber.New(appConfig)

	// middleware
	app.Use(recover.New())
	app.Use(requestid.New())
	app.Use(logger.New(ctx))
	app.Use(etag.New())
	app.Use(secure.New())
	if os.Getenv("ENV") != "prod" {
		app.Use(pprof.New())
		app.Use(expvar.New())
	}

	// router
	subDir := os.Getenv("SERVER_SUB_DIR")
	if subDir == "" {
		subDir = "/"
	}
	appRouter := app.Group(subDir)
	setupRoute(appRouter) // nolint:contextcheck

	return app
}

func setupRoute(app fiber.Router) {
	// API
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

	// Auth
	app.Get("/api/logout", handler.Logout)
	app.Get(
		"/api/connect/github",
		github.New(github.Config{
			ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
			ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		}),
		handler.ConnectGithub,
	)

	// debug
	if os.Getenv("ENV") != "prod" {
		app.Get("/helper/preview", handler.HelperParseFeed)
	}

	// telegram
	app.Post(
		"/webhook/telegram/"+os.Getenv("TELEGRAM_WEBHOOK_PATH"),
		validate.ContentType("application/json"),
		handler.TelegramWebhook,
	)

	// static
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
		zerolog.Ctx(c.UserContext()).Error().Str("module", "app").Stack().Err(err).Send()
	}
	return notCare
}

func cookieValidator(ctx context.Context, tokenStr string) ( /* Credential */ any, error) {
	plaintext, err := global.Sign.DecodeFromHex(tokenStr)
	if err != nil {
		return nil, errors.New("invalid token")
	}
	var credential types.Credential
	if err := json.Unmarshal(plaintext, &credential); err != nil {
		return nil, errors.New("broken token")
	}
	if time.Now().Unix() > credential.ExpiresAt {
		return nil, errors.New("expired token")
	}

	if _, err = global.Database.GetUserByID(ctx, credential.UserID); err != nil {
		if errors.Is(err, database.ErrEmptyRow) {
			err = errors.New("invalid user")
		}
		return nil, err
	}

	return credential, nil
}
