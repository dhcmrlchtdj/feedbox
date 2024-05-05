package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/cookie"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/github"
)

func Logout(c *fiber.Ctx) error {
	cookie.Clear(c)
	return c.Redirect("/")
}

func ConnectGithub(c *fiber.Ctx) error {
	ctx := c.UserContext()
	credential := c.Locals("credential").(*github.Profile)

	id := strconv.FormatInt(credential.ID, 10)
	user, err := database.GetOrCreateUserByGithub(ctx, id, credential.Email)
	if err != nil {
		return err
	}

	tokenStr, err := cookie.EncodeToToken(user.ID)
	if err != nil {
		return err
	}
	cookie.Set(c, tokenStr)

	return c.Redirect("/")
}
