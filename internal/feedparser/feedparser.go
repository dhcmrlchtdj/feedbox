package feedparser

import (
	"net/http"

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
	return &FeedParser{parser, new(http.Client)}
}

func (p *FeedParser) ParseURL(url string) (*gofeed.Feed, error) {
	req, err := http.NewRequest("GET", url, http.NoBody)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "FeedBox/2.0 (+https://feedbox.h11.io)")

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, errors.Errorf("'%v' return '%v'", url, resp.Status)
	}

	// sanitize body
	body, err := sanitize(resp.Body)
	if err != nil {
		return nil, errors.Wrap(err, url)
	}

	feed, err := p.parser.Parse(body)
	if err != nil {
		return nil, errors.Wrap(err, url)
	}

	// fix item
	if err := fixFeed(url, feed); err != nil {
		return nil, err
	}

	return feed, nil
}
