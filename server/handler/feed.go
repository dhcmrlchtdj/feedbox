package handler

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/util"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/cookie"
)

func FeedList(c *fiber.Ctx) error {
	ctx := c.UserContext()
	credential := c.Locals("credential").(cookie.UserProfile)

	feeds, err := database.GetFeedByUser(ctx, credential.UserID, "updated")
	if err != nil {
		return err
	}
	return errors.WithStack(c.JSON(feeds))
}

type feedAddBody struct {
	URL string `json:"url"`
}

func FeedAdd(c *fiber.Ctx) error {
	var b feedAddBody
	if err := c.BodyParser(&b); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	ctx := c.UserContext()
	credential := c.Locals("credential").(cookie.UserProfile)

	feedID, err := database.GetFeedIDByURL(ctx, strings.TrimSpace(b.URL))
	if err != nil {
		if errors.Is(err, database.ErrInvalidURL) {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		return err
	}

	if err = database.Subscribe(ctx, credential.UserID, feedID); err != nil {
		return err
	}

	feeds, err := database.GetFeedByUser(ctx, credential.UserID, "updated")
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
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	ctx := c.UserContext()
	credential := c.Locals("credential").(cookie.UserProfile)

	if err := database.Unsubscribe(ctx, credential.UserID, b.FeedID); err != nil {
		return err
	}

	feeds, err := database.GetFeedByUser(ctx, credential.UserID, "updated")
	if err != nil {
		return err
	}
	return c.JSON(feeds)
}

func FeedExport(c *fiber.Ctx) error {
	ctx := c.UserContext()
	credential := c.Locals("credential").(cookie.UserProfile)

	feeds, err := database.GetFeedByUser(ctx, credential.UserID, "url")
	if err != nil {
		return err
	}

	opml := util.BuildOPMLFromFeed(feeds)
	c.Set("content-type", "application/xml; charset=utf-8")
	return c.Send(opml)
}

func FeedImport(c *fiber.Ctx) error {
	ctx := c.UserContext()
	credential := c.Locals("credential").(cookie.UserProfile)

	fileheader, err := c.FormFile("opml")
	if err != nil {
		return err
	}
	file, err := fileheader.Open()
	if err != nil {
		return errors.WithStack(err)
	}
	urls, err := util.ExtractLinksFromOPML(file)
	file.Close()
	if err != nil {
		return err
	}

	if err = database.SubscribeURLs(ctx, credential.UserID, urls); err != nil {
		if errors.Is(err, database.ErrInvalidURL) {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		return err
	}

	feeds, err := database.GetFeedByUser(ctx, credential.UserID, "updated")
	if err != nil {
		return err
	}
	return c.JSON(feeds)
}
