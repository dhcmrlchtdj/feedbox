package feedparser

import (
	"bytes"
	"io"
	"unicode"

	"github.com/pkg/errors"
	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
)

func sanitize(source io.Reader) (io.Reader, error) {
	preview := make([]byte, 64)
	n, err := io.ReadFull(source, preview)
	switch {
	case errors.Is(err, io.ErrUnexpectedEOF):
		preview = preview[:n]
		source = bytes.NewReader(preview)
	case err != nil:
		return nil, err
	default:
		source = io.MultiReader(bytes.NewReader(preview), source)
	}

	if bytes.Contains(preview, []byte("UTF-8")) {
		source = removeNonPrintable(source)
	}

	return source, nil
}

func removeNonPrintable(xml io.Reader) io.Reader {
	// https://blog.zikes.me/post/cleaning-xml-files-before-unmarshaling-in-go/
	t := runes.Remove(runes.Predicate(func(r rune) bool {
		return !unicode.IsPrint(r)
	}))
	return transform.NewReader(xml, t)
}
