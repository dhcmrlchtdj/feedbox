package secure

import (
	"bytes"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// https://helmetjs.github.io/
// https://csp-evaluator.withgoogle.com/

func New() fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Set("x-content-type-options", "nosniff")

		err := c.Next()

		contentType := c.Response().Header.Peek("content-type")
		if bytes.Contains(contentType, []byte("text/html")) {
			// c.Set("referrer-policy", "strict-origin-when-cross-origin")
			c.Set("referrer-policy", "no-referrer")
			c.Set("content-security-policy", buildCSP(
				"default-src 'self'",
				"script-src 'self'",
				"style-src 'self' 'sha256-9OlNO0DNEeaVzHL4RZwCLsBHA8WBQ8toBp/4F5XV2nc='",
			))
		}

		return err
	}
}

func buildCSP(directives ...string) string {
	return strings.Join(directives, "; ")
}
