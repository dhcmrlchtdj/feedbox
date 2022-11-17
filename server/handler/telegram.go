package handler

import (
	"github.com/gofiber/fiber/v2"

	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
	"github.com/dhcmrlchtdj/feedbox/server/telegrambot"
)

func TelegramWebhook(c *fiber.Ctx) error {
	var b telegram.Update
	if err := c.BodyParser(&b); err != nil {
		return err
	}
	go telegrambot.HandleWebhook(c.UserContext(), &b)
	return c.SendString("ok")
}
