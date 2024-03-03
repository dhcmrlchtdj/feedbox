package feedparser

import (
	"errors"

	"github.com/mmcdole/gofeed"
	"github.com/mmcdole/gofeed/rss"
)

type customRSSTranslator struct {
	defaultTranslator *gofeed.DefaultRSSTranslator
}

func newCustomRSSTranslator() *customRSSTranslator {
	t := &customRSSTranslator{
		defaultTranslator: new(gofeed.DefaultRSSTranslator),
	}
	return t
}

func (ct *customRSSTranslator) Translate(feed any) (*gofeed.Feed, error) {
	rssFeed, ok := feed.(*rss.Feed)
	if !ok {
		return nil, errors.New("Feed did not match expected type of *rss.Feed")
	}

	f, err := ct.defaultTranslator.Translate(rssFeed)
	if err != nil {
		return nil, err
	}

	for i, item := range rssFeed.Items {
		comments := item.Comments
		if comments != "" {
			f.Items[i].Custom = map[string]string{"comments": comments}
		}
	}

	return f, nil
}
