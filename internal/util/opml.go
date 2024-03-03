package util

import (
	"bytes"
	"encoding/xml"
	"fmt"
	"html"
	"io"

	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/database/common"
)

type opml struct {
	Outlines []outline `xml:"body>outline"`
}

type outline struct {
	URL string `xml:"xmlUrl,attr"`
}

func ExtractLinksFromOPML(content io.Reader) ([]string, error) {
	var c opml
	if err := xml.NewDecoder(content).Decode(&c); err != nil {
		return nil, errors.WithStack(err)
	}

	links := []string{}
	for _, o := range c.Outlines {
		links = append(links, o.URL)
	}
	return links, nil
}

func BuildOPML(urls []string) []byte {
	var b bytes.Buffer

	// 90 is the average length of <outline>
	// b.Grow(100 + len(urls)*90)

	b.WriteString("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n")
	b.WriteString("<opml version=\"1.0\">\n")
	b.WriteString("<head><title>feeds</title></head>\n")
	b.WriteString("<body>\n")

	for _, url := range urls {
		text := html.EscapeString(ExtractSiteName(url))
		xmlURL := html.EscapeString(url)
		outline := fmt.Sprintf(`<outline type="rss" text="%s" xmlUrl="%s"/>`, text, xmlURL)
		b.WriteString(outline)
		b.WriteByte('\n')
	}

	b.WriteString("</body>\n")
	b.WriteString("</opml>\n")

	return b.Bytes()
}

func BuildOPMLFromFeed(feeds []common.Feed) []byte {
	urls := []string{}
	for _, feed := range feeds {
		urls = append(urls, feed.URL)
	}
	return BuildOPML(urls)
}
