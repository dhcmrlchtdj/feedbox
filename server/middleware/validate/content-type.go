package validate

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

func ContentType(t string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if !strings.HasPrefix(c.Get("content-type"), t) {
			return fiber.ErrUnsupportedMediaType
		}
		return c.Next()
	}
}
