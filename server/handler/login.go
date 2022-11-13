package handler

import (
	"encoding/json"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/dhcmrlchtdj/feedbox/internal/global"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/cookie"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/github"
	"github.com/dhcmrlchtdj/feedbox/server/types"
)

func Logout(c *fiber.Ctx) error {
	cookie.Clear(c)
	return c.Redirect("/")
}

func ConnectGithub(c *fiber.Ctx) error {
	credential := c.Locals("credential").(*github.Profile)
	id := strconv.FormatInt(credential.ID, 10)
	user, err := global.Database.GetOrCreateUserByGithub(id, credential.Email)
	if err != nil {
		return err
	}
	token := types.Credential{
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(time.Hour * 24 * 3).Unix(),
	}

	plaintext, err := json.Marshal(token)
	if err != nil {
		return err
	}
	tokenStr, err := global.Sign.EncodeToHex(plaintext)
	if err != nil {
		return err
	}

	cookie.Set(c, tokenStr)

	return c.Redirect("/")
}
