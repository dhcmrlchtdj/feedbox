package handler

import (
	"github.com/gofiber/fiber/v2"

	"github.com/dhcmrlchtdj/feedbox/util"
)

func HelperParseFeed(c *fiber.Ctx) error {
	url := c.Params("*")
	feedParser := util.NewFeedParser()
	feed, err := feedParser.ParseURL(url)
	if err != nil {
		return err
	}
	return c.JSON(feed)
}
