package handler

import (
	"github.com/gofiber/fiber/v3"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/cookie"
)

func UserInfo(c fiber.Ctx) error {
	ctx := c.Context()
	credential := c.Locals("credential").(cookie.UserProfile)

	user, err := database.GetUserByID(ctx, credential.UserID)
	if err != nil {
		return err
	}
	return c.JSON(user)
}
