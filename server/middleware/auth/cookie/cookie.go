package cookie

import (
	"github.com/gofiber/fiber/v2"
)

type Config struct {
	Name      string
	Validator func(token string) (interface{}, error)
}

func New(cfg Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Cookies(cfg.Name)
		if token == "" {
			return fiber.ErrUnauthorized
		}

		credential, err := cfg.Validator(token)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, err.Error())
		}

		c.Locals("credential", credential)

		return c.Next()
	}
}
