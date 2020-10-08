package logger

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"
)

func New() fiber.Handler {
	logger := log.Logger.With().Str("module", "server").Logger()
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		stop := time.Now()

		logger.Info().
			Dur("latency", stop.Sub(start)).
			Str("method", c.Method()).
			Str("path", c.Path()).
			Int("status", c.Response().StatusCode()).
			Int("bytes", len(c.Response().Body())).
			Str("request_id", c.Get("x-request-id")).
			Str("cf_ray", c.Get("cf-ray")).
			Str("ip", c.IP()).
			Str("ua", c.Get(fiber.HeaderUserAgent)).
			Str("referer", c.Get(fiber.HeaderReferer)).
			Send()

		return err
	}
}
