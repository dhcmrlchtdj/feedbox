package feedparser

import (
	"io"
	"unicode"

	"golang.org/x/net/html/charset"
	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
)

func sanitize(source io.Reader, contentType string) (io.Reader, error) {
	r, err := charset.NewReader(source, contentType)
	if err != nil {
		return nil, err
	}

	r = removeNonPrintable(r)
	return r, nil
}

func removeNonPrintable(xml io.Reader) io.Reader {
	// https://blog.zikes.me/post/cleaning-xml-files-before-unmarshaling-in-go/
	t := runes.Remove(runes.Predicate(func(r rune) bool {
		return !unicode.IsPrint(r)
	}))
	return transform.NewReader(xml, t)
}
