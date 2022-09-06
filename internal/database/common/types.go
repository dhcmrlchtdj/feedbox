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
}

var ErrEmptyRow = errors.New("empty row")

var ErrInvalidURL = errors.New("invalid url")
