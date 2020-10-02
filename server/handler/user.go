package handler

import (
	"github.com/gofiber/fiber/v2"

	db "github.com/dhcmrlchtdj/feedbox/database"
	"github.com/dhcmrlchtdj/feedbox/server/typing"
)

func UserInfo(c *fiber.Ctx) error {
	credential := c.Locals("credential").(typing.Credential)
	user, err := db.Client.GetUserByID(credential.UserID)
	if err != nil {
		return err
	}
	return c.JSON(user)
}
