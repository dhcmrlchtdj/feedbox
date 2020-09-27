package worker

import (
	"fmt"
	"net/http"
	neturl "net/url"

	"github.com/mmcdole/gofeed"
	"github.com/mmcdole/gofeed/rss"
	"github.com/pkg/errors"
)

type feedParser struct {
	parser *gofeed.Parser
	client *http.Client
}

func newFeedParser() *feedParser {
	parser := gofeed.NewParser()
	parser.RSSTranslator = newCustomRSSTranslator()
	return &feedParser{parser, &http.Client{}}
}

func (p *feedParser) ParseURL(url string) (*gofeed.Feed, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "feedbox.h11.io")
	resp, err := p.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("'%v' return '%v'", url, resp.Status)
	}
	feed, err := p.parser.Parse(resp.Body)
	if err != nil {
		return nil, errors.Wrap(err, url)
	}

	if normalizeItemURL(url, feed) != nil {
		return nil, errors.Wrap(err, url)
	}

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
		item.Link = string(link)
	}
	return nil
}

type customRSSTranslator struct {
	defaultTranslator *gofeed.DefaultRSSTranslator
}

func newCustomRSSTranslator() *customRSSTranslator {
	t := &customRSSTranslator{}
	t.defaultTranslator = &gofeed.DefaultRSSTranslator{}
	return t
}

func (ct *customRSSTranslator) Translate(feed interface{}) (*gofeed.Feed, error) {
	rss, ok := feed.(*rss.Feed)
	if !ok {
		return nil, errors.New("Feed did not match expected type of *rss.Feed")
	}

	f, err := ct.defaultTranslator.Translate(rss)
	if err != nil {
		return nil, err
	}

	for i, item := range rss.Items {
		f.Items[i].Custom = map[string]string{"comments": item.Comments}
	}

	return f, nil
}
