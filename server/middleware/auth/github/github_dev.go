//go:build dev

package github

import (
	"github.com/gofiber/fiber/v2"
)

func New(cfg Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		profile := &Profile{
			Email: "email@example.com",
			ID:    1,
		}
		c.Locals("credential", profile)
		return c.Next()
	}
}
