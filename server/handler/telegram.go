package handler

import (
	"github.com/gofiber/fiber/v2"

	"github.com/dhcmrlchtdj/feedbox/service/telegram"
)

func TelegramWebhook(c *fiber.Ctx) error {
	var b telegram.Update
	if err := c.BodyParser(&b); err != nil {
		return err
	}
	telegram.HandleWebhook(&b)
	return c.SendString("ok")
}
