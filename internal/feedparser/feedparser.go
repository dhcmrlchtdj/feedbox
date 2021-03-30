package feedparser

import (
	"io"
	"net/http"
	neturl "net/url"
	"unicode"

	"github.com/mmcdole/gofeed"
	"github.com/pkg/errors"
	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
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
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "FeedBox (+https://feedbox.h11.io)")

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, errors.Errorf("'%v' return '%v'", url, resp.Status)
	}

	feed, err := p.parser.Parse(resp.Body)
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

func removeNonPrintable(xml io.Reader) io.Reader {
	// https://blog.zikes.me/post/cleaning-xml-files-before-unmarshaling-in-go/
	t := runes.Remove(runes.Predicate(func(r rune) bool {
		return !unicode.IsPrint(r)
	}))
	return transform.NewReader(xml, t)
}
