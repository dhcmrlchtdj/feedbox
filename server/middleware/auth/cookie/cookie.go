package cookie

import (
	"time"

	"github.com/gofiber/fiber/v2"
)

type Config struct {
	Validator func(token string) (any, error)
	Name      string
}

func New(cfg Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Cookies(cfg.Name)
		if token == "" {
			return fiber.ErrUnauthorized
		}

		credential, err := cfg.Validator(token)
		if err != nil {
			Clear(c)
			return fiber.NewError(fiber.StatusUnauthorized, err.Error())
		}

		c.Locals("credential", credential)

		return c.Next()
	}
}

///

func Set(c *fiber.Ctx, cookie string) {
	c.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    cookie,
		Path:     "/api",
		MaxAge:   int((time.Hour * 24 * 3) / time.Second),
		Secure:   true,
		HTTPOnly: true,
		SameSite: "strict",
	})
}

func Clear(c *fiber.Ctx) {
	c.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    "",
		Path:     "/api",
		Expires:  time.Date(1970, time.January, 1, 0, 0, 0, 0, time.UTC),
		Secure:   true,
		HTTPOnly: true,
		SameSite: "strict",
	})
}
