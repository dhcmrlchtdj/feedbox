package feedparser

import (
	"context"
	"net/http"

	"github.com/mmcdole/gofeed"
	"github.com/morikuni/failure"
)

type FeedParser struct {
	parser *gofeed.Parser
	client *http.Client
}

func New() *FeedParser {
	parser := gofeed.NewParser()
	parser.RSSTranslator = newCustomRSSTranslator()
	return &FeedParser{parser, new(http.Client)}
}

func (p *FeedParser) ParseURL(ctx context.Context, url string, etag string) (*gofeed.Feed, string, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", url, http.NoBody)
	if err != nil {
		return nil, "", err
	}
	if etag != "" {
		req.Header.Set("If-None-Match", etag)
	}
	req.Header.Set("User-Agent", "FeedBox/2.0 (+https://github.com/dhcmrlchtdj/feedbox)")

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 304 {
		return nil, etag, nil
	}

	if resp.StatusCode != 200 {
		return nil, "", failure.Unexpected(resp.Status, failure.Message(url))
	}

	// sanitize body
	body, err := sanitize(resp.Body)
	if err != nil {
		return nil, "", failure.Wrap(err, failure.Message(url))
	}

	feed, err := p.parser.Parse(body)
	if err != nil {
		return nil, "", failure.Wrap(err, failure.Message(url))
	}

	// fix item
	if err := fixFeed(url, feed); err != nil {
		return nil, "", err
	}

	newEtag := resp.Header.Get("etag")

	return feed, newEtag, nil
}
