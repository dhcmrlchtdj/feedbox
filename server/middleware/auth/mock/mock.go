package mock

import (
	"github.com/gofiber/fiber/v2"
)

func Set(credential interface{}) fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Locals("credential", credential)
		return c.Next()
	}
}
