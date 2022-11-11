package handler

import (
	"github.com/gofiber/fiber/v2"

	"github.com/dhcmrlchtdj/feedbox/internal/feedparser"
)

func HelperParseFeed(c *fiber.Ctx) error {
	url := c.Params("*")
	fp := feedparser.New()
	feed, _, err := fp.ParseURL(url, "")
	if err != nil {
		return err
	}
	return c.JSON(feed)
}
