package feedparser

import (
	"net/url"

	"github.com/mmcdole/gofeed"
	"github.com/pkg/errors"
)

func fixFeed(source string, feed *gofeed.Feed) error {
	if err := normalizeItemLink(source, feed); err != nil {
		return errors.WithMessage(err, source)
	}
	restoreFeedburnerLink(feed)
	return nil
}

func normalizeItemLink(source string, feed *gofeed.Feed) error {
	base, err := url.Parse(source)
	if err != nil {
		return errors.WithStack(err)
	}
	for _, item := range feed.Items {
		absLink, err := base.Parse(item.Link)
		if err != nil {
			return errors.WithStack(err)
		}
		link, err := absLink.MarshalBinary()
		if err != nil {
			return errors.WithStack(err)
		}
		item.Link = string(link)
	}
	return nil
}

func restoreFeedburnerLink(feed *gofeed.Feed) {
	if _, found := feed.Extensions["feedburner"]; !found {
		return
	}

	for _, item := range feed.Items {
		feedburner, found := item.Extensions["feedburner"]
		if !found {
			continue
		}
		origLinks, found := feedburner["origLink"]
		if !found {
			continue
		}
		if len(origLinks) == 0 {
			continue
		}
		origLink := origLinks[0]
		item.Link = origLink.Value
	}
}
