package logger

import (
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func New() fiber.Handler {
	var once sync.Once
	var errHandler fiber.ErrorHandler

	logger := log.Logger.With().Str("module", "server").Logger()

	return func(c *fiber.Ctx) error {
		once.Do(func() {
			errHandler = c.App().Config().ErrorHandler
		})

		start := time.Now()
		chainErr := c.Next()
		stop := time.Now()

		if chainErr != nil {
			if err := errHandler(c, chainErr); err != nil {
				_ = c.SendStatus(fiber.StatusInternalServerError)
			}
		}

		logger.Info().
			Dict("request", zerolog.Dict().
				Str("method", c.Method()).
				Str("path", c.Path()).
				Str("ip", c.IP()).
				Dict("header", zerolog.Dict().
					Str("x-forwarded-for", c.Get("x-forwarded-for")).
					Str("x-request-id", c.Get("x-request-id")).
					Str("cf-request-id", c.Get("cf-request-id")).
					Str("if-none-match", c.Get("if-none-match")).
					Str("ua", c.Get("user-agent")).
					Str("referer", c.Get("referer")),
				),
			).
			Dict("response", zerolog.Dict().
				Int("bytes", len(c.Response().Body())).
				Int("status", c.Response().StatusCode()).
				Bytes("etag", c.Response().Header.Peek("etag")).
				Dur("latency", stop.Sub(start)),
			).
			Send()

		return nil
	}
}
