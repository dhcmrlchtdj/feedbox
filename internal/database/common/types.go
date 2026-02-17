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
	Err     string     `json:"err,omitempty"`
	ErrAt   *time.Time `json:"errAt,omitempty"`
}

type Task struct {
	Platform string `json:"platform"`
	Payload  string `json:"payload"`
}

var (
	ErrEmptyRow   = errors.New("empty row")
	ErrInvalidURL = errors.New("invalid url")
)
