package common

import (
	"time"

	"github.com/pkg/errors"
)

type User struct {
	ID       int64             `json:"id"`
	Platform string            `json:"platform"`
	PID      string            `json:"pid"`
	Addition map[string]string `json:"addition"`
}

type Feed struct {
	ID      int64      `json:"id"`
	URL     string     `json:"url"`
	Updated *time.Time `json:"updated"`
	ETag    string     `json:"etag"`
}

var (
	ErrEmptyRow   = errors.New("empty row")
	ErrInvalidURL = errors.New("invalid url")
)
