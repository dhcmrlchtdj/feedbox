package handler

import (
	"github.com/gofiber/fiber/v2"

	"github.com/dhcmrlchtdj/feedbox/internal/global"
	"github.com/dhcmrlchtdj/feedbox/server/typing"
)

func UserInfo(c *fiber.Ctx) error {
	credential := c.Locals("credential").(typing.Credential)
	user, err := global.DB.GetUserByID(credential.UserID)
	if err != nil {
		return err
	}
	return c.JSON(user)
}
