package feedparser

import (
	neturl "net/url"

	"github.com/mmcdole/gofeed"
	"github.com/pkg/errors"
)

type FeedParser struct {
	parser *gofeed.Parser
}

func New() *FeedParser {
	parser := gofeed.NewParser()
	parser.UserAgent = "FeedBox (+https://feedbox.h11.io)"
	parser.RSSTranslator = newCustomRSSTranslator()
	return &FeedParser{parser}
}

func (p *FeedParser) ParseURL(url string) (*gofeed.Feed, error) {
	feed, err := p.parser.ParseURL(url)
	if err != nil {
		return nil, errors.Wrap(err, url)
	}

	// fix item
	if err := normalizeItemURL(url, feed); err != nil {
		return nil, errors.Wrap(err, url)
	}
	restoreFeedburnerLink(feed)

	return feed, nil
}

func normalizeItemURL(url string, feed *gofeed.Feed) error {
	base, err := neturl.Parse(url)
	if err != nil {
		return err
	}
	for _, item := range feed.Items {
		absLink, err := base.Parse(item.Link)
		if err != nil {
			return err
		}
		link, err := absLink.MarshalBinary()
		if err != nil {
			return err
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
