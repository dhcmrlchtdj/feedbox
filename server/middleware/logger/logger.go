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

		reqHeader := zerolog.Dict()
		c.Request().Header.VisitAll(func(key []byte, value []byte) {
			k := string(key)
			if k != "Cookie" {
				reqHeader = reqHeader.Bytes(k, value)
			}
		})

		start := time.Now()
		chainErr := c.Next()
		stop := time.Now()

		if chainErr != nil {
			if err := errHandler(c, chainErr); err != nil {
				_ = c.SendStatus(fiber.StatusInternalServerError)
			}
		}

		respHeader := zerolog.Dict()
		c.Response().Header.VisitAll(func(key []byte, value []byte) {
			k := string(key)
			if k != "Set-Cookie" {
				respHeader = respHeader.Bytes(k, value)
			}
		})

		logger.Info().
			Str("method", c.Method()).
			Str("path", c.Path()).
			Int("status", c.Response().StatusCode()).
			Int("bytes", len(c.Response().Body())).
			Dict("request", reqHeader).
			Dict("response", respHeader).
			Dur("latency", stop.Sub(start)).
			Send()

		return nil
	}
}
