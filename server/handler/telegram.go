package handler

import (
	"github.com/gofiber/fiber/v3"

	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
	"github.com/dhcmrlchtdj/feedbox/server/telegrambot"
)

func TelegramWebhook(c fiber.Ctx) error {
	var b telegram.Update
	if err := c.Bind().JSON(&b); err != nil {
		return err
	}
	go telegrambot.HandleWebhook(c.Context(), &b)
	return c.SendString("ok")
}
