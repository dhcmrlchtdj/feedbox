package database

import (
	"strings"
	"time"

	"github.com/pkg/errors"
	"github.com/rs/zerolog"

	"github.com/dhcmrlchtdj/feedbox/internal/database/common"
	"github.com/dhcmrlchtdj/feedbox/internal/database/postgresql"
	"github.com/dhcmrlchtdj/feedbox/internal/database/sqlite"
)

var C Database

type Database interface {
	Close()
	GetUserByID(id int64) (*User, error)
	GetOrCreateUserByGithub(githubID string, email string) (*User, error)
	GetOrCreateUserByTelegram(chatID string) (*User, error)
	GetFeedIDByURL(url string) (int64, error)
	GetFeedByUser(userID int64, orderBy string) ([]Feed, error)
	GetActiveFeeds() ([]Feed, error)
	AddFeedLinks(id int64, links []string, updated *time.Time, etag string) error
	SetFeedUpdated(id int64, updated *time.Time, etag string) error
	GetLinks(feedID int64) ([]string, error)
	GetSubscribers(feedID int64) ([]User, error)
	Subscribe(userID int64, feedID int64) error
	Unsubscribe(userID int64, feedID int64) error
	UnsubscribeAll(userID int64) error
	SubscribeURL(userID int64, url string) error
	SubscribeURLs(userID int64, urls []string) error
}

///

type (
	User = common.User
	Feed = common.Feed
)

var (
	ErrEmptyRow   = common.ErrEmptyRow
	ErrInvalidURL = common.ErrInvalidURL
)

///

func New(uri string, logger *zerolog.Logger) (Database, error) {
	if strings.HasPrefix(uri, "postgres://") {
		return postgresql.New(uri, logger)
	}

	if strings.HasPrefix(uri, "sqlite://") {
		return sqlite.New(uri, logger)
	}

	return nil, errors.New("unknown database url")
}
