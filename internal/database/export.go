package database

import (
	"context"
	"strings"
	"time"

	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/database/common"
	"github.com/dhcmrlchtdj/feedbox/internal/database/sqlite"
)

type Database interface {
	Close()
	GetUserByID(ctx context.Context, id int64) (*User, error)
	GetOrCreateUserByGithub(ctx context.Context, githubID string, email string) (*User, error)
	GetOrCreateUserByTelegram(ctx context.Context, chatID string) (*User, error)
	GetFeedIDByURL(ctx context.Context, url string) (int64, error)
	GetFeedByUser(ctx context.Context, userID int64, orderBy string) ([]Feed, error)
	GetActiveFeeds(ctx context.Context) ([]Feed, error)
	AddFeedLinks(ctx context.Context, id int64, links []string, updated *time.Time, etag string) error
	SetFeedUpdated(ctx context.Context, id int64, updated *time.Time, etag string) error
	GetLinks(ctx context.Context, feedID int64) ([]string, error)
	GetSubscribers(ctx context.Context, feedID int64) ([]User, error)
	Subscribe(ctx context.Context, userID int64, feedID int64) error
	Unsubscribe(ctx context.Context, userID int64, feedID int64) error
	UnsubscribeAll(ctx context.Context, userID int64) error
	SubscribeURL(ctx context.Context, userID int64, url string) error
	SubscribeURLs(ctx context.Context, userID int64, urls []string) error
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

func New(ctx context.Context, uri string) (Database, error) {
	if strings.HasPrefix(uri, "sqlite://") {
		return sqlite.New(ctx, uri)
	}

	return nil, errors.New("unknown database url")
}
