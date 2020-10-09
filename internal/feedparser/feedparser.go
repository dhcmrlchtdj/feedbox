package feedparser

import (
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	neturl "net/url"

	"github.com/mmcdole/gofeed"
	"github.com/mmcdole/gofeed/rss"
	"github.com/pkg/errors"
)

type FeedParser struct {
	parser *gofeed.Parser
	client *http.Client
}

func New() *FeedParser {
	parser := gofeed.NewParser()
	parser.RSSTranslator = newCustomRSSTranslator()
	return &FeedParser{parser, &http.Client{}}
}

func (p *FeedParser) ParseURL(url string) (*gofeed.Feed, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "feedbox.h11.io")
	resp, err := p.client.Do(req)
	if resp != nil {
		defer resp.Body.Close()
	}
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != 200 {
		io.Copy(ioutil.Discard, resp.Body)
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
		if err != nil {
			return err
		}
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
		comment := item.Comments
		if len(comment) > 0 {
			f.Items[i].Custom = map[string]string{"comments": comment}
		}
	}

	return f, nil
}
