package logger

import (
	"context"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

func New(ctx context.Context) fiber.Handler {
	var once sync.Once
	var errHandler fiber.ErrorHandler

	return func(c *fiber.Ctx) error {
		logger := zerolog.Ctx(ctx).
			With().
			Str("traceId", c.Locals("requestid").(string)).
			Logger()
		c.SetUserContext(logger.WithContext(ctx))

		once.Do(func() {
			errHandler = c.App().Config().ErrorHandler
		})

		reqHeader := zerolog.Dict()
		c.Request().Header.VisitAll(func(key []byte, value []byte) {
			// k := *(*string)(unsafe.Pointer(&key))
			reqHeader = reqHeader.Bytes(string(key), value)
		})

		start := time.Now()
		chainErr := c.Next()
		latency := time.Since(start)

		if chainErr != nil {
			if err := errHandler(c, chainErr); err != nil {
				_ = c.SendStatus(fiber.StatusInternalServerError)
			}
		}

		resp := c.Response()

		respHeader := zerolog.Dict()
		resp.Header.VisitAll(func(key []byte, value []byte) {
			respHeader = respHeader.Bytes(string(key), value)
		})

		logger.
			Info().
			Str("module", "server").
			Str("remote", c.IP()).
			Dur("latency", latency).
			Dict("request", zerolog.Dict().
				Str("protocol", c.Protocol()).
				Str("method", c.Method()).
				Str("host", c.Hostname()).
				Str("pathname", c.Path()).
				Dict("header", reqHeader),
			).
			Dict("response", zerolog.Dict().
				Int("status", resp.StatusCode()).
				Int("size", len(resp.Body())).
				Dict("header", respHeader),
			).
			Send()

		return nil
	}
}
