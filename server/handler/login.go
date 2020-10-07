package handler

import (
	"encoding/json"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/dhcmrlchtdj/feedbox/internal/global"
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

func ConnectGithub(c *fiber.Ctx) error {
	credential := c.Locals("credential").(*github.Profile)
	id := strconv.FormatInt(credential.ID, 10)
	user, err := global.DB.GetOrCreateUserByGithub(id, credential.Email)
	if err != nil {
		return err
	}
	token := typing.Credential{
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(time.Hour * 24 * 3).Unix(),
	}

	plaintext, err := json.Marshal(token)
	if err != nil {
		return err
	}
	tokenStr, err := global.Sign.EncodeToBase64(plaintext)
	if err != nil {
		return err
	}

	c.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    tokenStr,
		Path:     "/api",
		MaxAge:   int((time.Hour * 24 * 3) / time.Second),
		Secure:   true,
		HTTPOnly: true,
		SameSite: "strict",
	})

	return c.Redirect("/")
}
