package worker

import (
	"fmt"
	"net/http"

	"github.com/mmcdole/gofeed"
	"github.com/mmcdole/gofeed/rss"
)

type feedParser struct {
	parser *gofeed.Parser
	client *http.Client
}

func NewFeedParser() *feedParser {
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
	return p.parser.Parse(resp.Body)
}

func (p *feedParser) ParseString(s string) (*gofeed.Feed, error) {
	return p.parser.ParseString(s)
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
	rss, found := feed.(*rss.Feed)
	if !found {
		return nil, fmt.Errorf("Feed did not match expected type of *rss.Feed")
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
