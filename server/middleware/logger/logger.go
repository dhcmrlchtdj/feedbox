package logger

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func New() fiber.Handler {
	logger := log.Logger.With().Str("module", "server").Logger()
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		stop := time.Now()

		logger.Info().
			Dict("request", zerolog.Dict().
				Str("method", c.Method()).
				Str("path", c.Path()).
				Str("ip", c.IP()).
				Dict("header", zerolog.Dict().
					Strs("ips", c.IPs()).
					Str("x-request-id", c.Get("x-request-id")).
					Str("cf-request-id", c.Get("cf-request-id")).
					Str("ua", c.Get("user-agent")).
					Str("referer", c.Get("referer")),
				),
			).
			Dict("response", zerolog.Dict().
				Int("bytes", len(c.Response().Body())).
				Int("status", c.Response().StatusCode()).
				Dur("latency", stop.Sub(start)),
			).
			Send()

		return err
	}
}
