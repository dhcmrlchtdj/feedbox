package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/feedparser"
)

func HelperParseFeed(c *fiber.Ctx) error {
	url := c.Query("u")
	fp := feedparser.New()
	feed, _, err := fp.ParseURL(c.UserContext(), url, "")
	if err != nil {
		return errors.WithStack(err)
	}
	return c.JSON(feed)
}
