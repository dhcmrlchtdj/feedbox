package secure

import "github.com/gofiber/fiber/v2"

func New() fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Set("x-xss-protection", "1; mode=block")
		c.Set("x-content-type-options", "nosniff")
		c.Set("x-frame-options", "DENY")
		c.Set("referrer-policy", "strict-origin-when-cross-origin")
		// c.Set("Content-Security-Policy", "")

		return c.Next()
	}
}
