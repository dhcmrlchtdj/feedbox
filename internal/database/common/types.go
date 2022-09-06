package common

import "github.com/pkg/errors"

type User struct {
	ID       int64             `json:"id"`
	Platform string            `json:"platform"`
	PID      string            `json:"pid"`
	Addition map[string]string `json:"addition"`
}

type Feed struct {
	ID      int64  `json:"id"`
	URL     string `json:"url"`
	Updated *int64 `json:"updated"`
}

var ErrEmptyRow = errors.New("empty row")

var ErrInvalidURL = errors.New("invalid url")
