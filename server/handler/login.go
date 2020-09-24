package handler

import (
	"strconv"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gofiber/fiber/v2"

	db "github.com/dhcmrlchtdj/feedbox/database"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/github"
	"github.com/dhcmrlchtdj/feedbox/server/typing"
)

func Logout(c *fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    "",
		Path:     "/api",
		Expires:  time.Date(1970, time.January, 1, 0, 0, 0, 0, time.UTC),
		Secure:   true,
		HTTPOnly: true,
		SameSite: "strict",
	})
	return c.Redirect("/")
}

func ConnectGithub(cookieSecret []byte) fiber.Handler {
	return func(c *fiber.Ctx) error {
		credential := c.Locals("credential").(*github.Profile)
		id := strconv.FormatInt(credential.ID, 10)
		user, err := db.Client.GetOrCreateUserByGithub(id, credential.Email)
		if err != nil {
			return err
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, &typing.Credential{
			UserID: user.ID,
			StandardClaims: jwt.StandardClaims{
				ExpiresAt: time.Now().Add(time.Hour * 24 * 3).Unix(),
			},
		})
		tokenStr, err := token.SignedString(cookieSecret)
		if err != nil {
			return err
		}

		c.Cookie(&fiber.Cookie{
			Name:     "token",
			Value:    tokenStr,
			Path:     "/api",
			Expires:  time.Now().Add(time.Hour * 24 * 3),
			Secure:   true,
			HTTPOnly: true,
			SameSite: "strict",
		})

		return c.Redirect("/")
	}
}
