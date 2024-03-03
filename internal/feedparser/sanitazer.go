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
		return nil, errors.WithStack(err)
	default:
		source = io.MultiReader(bytes.NewReader(preview), source)
	}

	isUtf8 := bytes.Contains(preview, []byte("utf-8")) || bytes.Contains(preview, []byte("UTF-8"))
	noEnc := !bytes.Contains(preview, []byte("encoding"))
	if isUtf8 || noEnc {
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
