package server

import (
	"errors"
	"fmt"
	"os"

	"github.com/dgrijalva/jwt-go"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/pprof"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"github.com/dhcmrlchtdj/feedbox/server/handler"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/cookie"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/github"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/validate"
	"github.com/dhcmrlchtdj/feedbox/server/typing"
	"github.com/dhcmrlchtdj/feedbox/service/monitor"
)

func Create() *fiber.App {
	// app
	app := fiber.New(fiber.Config{
		// Immutable:  true,
		// BodyLimit:  4 * 1024 * 1024,
		StrictRouting: true,
		CaseSensitive: true,
		ETag:          true,
		ErrorHandler:  errorHandler,
	})
	app.Use(recover.New())
	if os.Getenv("ENV") != "prod" {
		app.Use(logger.New())
		app.Use(pprof.New())
	}

	// route
	api := app.Group(
		"/api/v1",
		cookie.New(cookie.Config{
			Name:      "token",
			Validator: jwtValidator([]byte(os.Getenv("COOKIE_SECRET"))),
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
		handler.ConnectGithub([]byte(os.Getenv("COOKIE_SECRET"))))

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

	return app
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

func jwtValidator(cookieSecret []byte) func(string) ( /* *Credential */ interface{}, error) {
	return func(tokenStr string) (interface{}, error) {
		token, err := jwt.ParseWithClaims(
			tokenStr,
			&typing.Credential{},
			func(token *jwt.Token) (interface{}, error) {
				if token.Method.Alg() != jwt.SigningMethodHS256.Name {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return cookieSecret, nil
			})
		if err != nil {
			return nil, err
		}

		if claims, ok := token.Claims.(*typing.Credential); ok && token.Valid {
			return claims, nil
		} else {
			return nil, errors.New("invalid token")
		}
	}
}
