package feedparser

import (
	"context"
	"net/http"
	"os"
	"time"

	"github.com/mmcdole/gofeed"
	"github.com/pkg/errors"
)

type FeedParser struct {
	parser *gofeed.Parser
	client *http.Client
}

func New() *FeedParser {
	parser := gofeed.NewParser()
	parser.RSSTranslator = newCustomRSSTranslator()
	client := &http.Client{
		Timeout: 10 * time.Second,
	}
	return &FeedParser{parser, client}
}

func (p *FeedParser) ParseURL(ctx context.Context, url string, etag string) (*gofeed.Feed, string, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", url, http.NoBody)
	if err != nil {
		return nil, "", errors.WithStack(err)
	}
	if etag != "" {
		req.Header.Set("If-None-Match", etag)
	}
	server := os.Getenv("SERVER")
	req.Header.Set("User-Agent", "FeedBox/2.0 (+"+server+")")

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, "", errors.WithStack(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 304 {
		return nil, etag, nil
	}

	if resp.StatusCode != 200 {
		return nil, "", errors.WithMessage(errors.New(resp.Status), url)
	}

	// sanitize body
	body, err := sanitize(resp.Body)
	if err != nil {
		return nil, "", errors.WithMessage(err, url)
	}

	feed, err := p.parser.Parse(body)
	if err != nil {
		return nil, "", errors.Wrap(err, url)
	}

	// fix item
	if err := fixFeed(url, feed); err != nil {
		return nil, "", errors.WithStack(err)
	}

	newEtag := resp.Header.Get("etag")

	return feed, newEtag, nil
}
