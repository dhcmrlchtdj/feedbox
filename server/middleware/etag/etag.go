package etag

import (
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/zeebo/xxh3"
)

type Config struct {
	Skip func(c *fiber.Ctx) bool
}

func New(cfg Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if cfg.Skip != nil && cfg.Skip(c) {
			return c.Next()
		}

		err := c.Next()
		if err != nil {
			return err
		}
		if c.Method() != fiber.MethodGet {
			return nil
		}

		resp := c.Response()
		if resp.StatusCode() != fiber.StatusOK {
			return nil
		}

		body := resp.Body()
		if len(body) == 0 {
			return nil
		}

		clientETags := c.Get("if-none-match")

		sum := xxh3.Hash(body)
		serverETag := fmt.Sprintf(`W/"%d-%016x"`, len(body), sum)
		c.Set("etag", serverETag)

		if strings.Contains(clientETags, serverETag) {
			return c.Status(fiber.StatusNotModified).Send(nil)
		}

		return nil
	}
}
