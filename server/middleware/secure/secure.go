package secure

import (
	"bytes"

	"github.com/gofiber/fiber/v2"
)

func New() fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Set("x-content-type-options", "nosniff")

		err := c.Next()

		contentType := c.Response().Header.Peek("content-type")
		if bytes.Contains(contentType, []byte("text/html")) {
			c.Set("x-xss-protection", "1; mode=block")
			c.Set("x-frame-options", "DENY")
			c.Set("referrer-policy", "strict-origin-when-cross-origin")
			// c.Set("Content-Security-Policy", "")
		}

		return err
	}
}
