package handler

import (
	"github.com/gofiber/fiber/v2"

	db "github.com/dhcmrlchtdj/feedbox/database"
	"github.com/dhcmrlchtdj/feedbox/server/typing"
	"github.com/dhcmrlchtdj/feedbox/util"
)

func FeedList(c *fiber.Ctx) error {
	credential := c.Locals("credential").(typing.Credential)
	feeds, err := db.Client.GetFeedByUser(credential.UserID)
	if err != nil {
		return err
	}
	return c.JSON(feeds)
}

type feedAddBody struct {
	URL string `json:"url"`
}

func FeedAdd(c *fiber.Ctx) error {
	var b feedAddBody
	if err := c.BodyParser(&b); err != nil {
		return err
	}

	credential := c.Locals("credential").(typing.Credential)

	feedID, err := db.Client.GetFeedIDByURL(b.URL)
	if err != nil {
		return err
	}

	if err := db.Client.Subscribe(credential.UserID, feedID); err != nil {
		return err
	}

	feeds, err := db.Client.GetFeedByUser(credential.UserID)
	if err != nil {
		return err
	}
	return c.JSON(feeds)
}

type feedRemoveBody struct {
	FeedID int64 `json:"feedID"`
}

func FeedRemove(c *fiber.Ctx) error {
	var b feedRemoveBody
	if err := c.BodyParser(&b); err != nil {
		return err
	}

	credential := c.Locals("credential").(typing.Credential)
	if err := db.Client.Unsubscribe(credential.UserID, b.FeedID); err != nil {
		return err
	}

	feeds, err := db.Client.GetFeedByUser(credential.UserID)
	if err != nil {
		return err
	}
	return c.JSON(feeds)
}

func FeedExport(c *fiber.Ctx) error {
	credential := c.Locals("credential").(typing.Credential)

	feeds, err := db.Client.GetFeedByUser(credential.UserID)
	if err != nil {
		return err
	}

	opml := util.BuildOPMLFromFeed(feeds)
	c.Set("content-type", "application/xml")
	return c.Send(opml)
}

func FeedImport(c *fiber.Ctx) error {
	credential := c.Locals("credential").(typing.Credential)

	fileheader, err := c.FormFile("opml")
	if err != nil {
		return err
	}
	file, err := fileheader.Open()
	if err != nil {
		return err
	}
	urls, err := util.ExtractLinksFromOPML(file)
	file.Close()
	if err != nil {
		return err
	}

	if err := db.Client.SubscribeURLs(credential.UserID, urls); err != nil {
		return err
	}

	feeds, err := db.Client.GetFeedByUser(credential.UserID)
	if err != nil {
		return err
	}
	return c.JSON(feeds)
}
