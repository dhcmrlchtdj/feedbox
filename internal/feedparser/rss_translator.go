package feedparser

import (
	"github.com/mmcdole/gofeed"
	"github.com/mmcdole/gofeed/rss"
	"github.com/pkg/errors"
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

func (ct *customRSSTranslator) Translate(feed interface{}) (*gofeed.Feed, error) {
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
		if len(comments) > 0 {
			f.Items[i].Custom = map[string]string{"comments": comments}
		}
	}

	return f, nil
}
