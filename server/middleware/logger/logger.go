package logger

import (
	"os"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func New() fiber.Handler {
	var once sync.Once
	var errHandler fiber.ErrorHandler

	prod := os.Getenv("ENV") == "prod"
	logger := log.Logger.With().Str("module", "server").Logger()

	return func(c *fiber.Ctx) error {
		once.Do(func() {
			errHandler = c.App().Config().ErrorHandler
		})

		reqHeader := zerolog.Dict()
		c.Request().Header.VisitAll(func(key []byte, value []byte) {
			k := string(key)
			if prod && k == "Cookie" {
				return
			}
			reqHeader = reqHeader.Bytes(k, value)
		})

		start := time.Now()
		chainErr := c.Next()
		latency := time.Since(start)

		if chainErr != nil {
			if err := errHandler(c, chainErr); err != nil {
				c.SendStatus(fiber.StatusInternalServerError) //nolint:errcheck
			}
		}

		resp := c.Response()

		respHeader := zerolog.Dict()
		resp.Header.VisitAll(func(key []byte, value []byte) {
			k := string(key)
			if prod && k == "Set-Cookie" {
				return
			}
			respHeader = respHeader.Bytes(k, value)
		})

		logger.Info().
			// Str("remote", c.IP()).
			Str("method", c.Method()).
			Str("path", c.Path()).
			Int("status", resp.StatusCode()).
			Int("bytes", len(resp.Body())).
			Dict("request", reqHeader).
			Dict("response", respHeader).
			Dur("latency", latency).
			Send()

		return nil
	}
}
