package database

import (
	"context"
	"strings"
	"sync/atomic"
	"time"

	"github.com/dhcmrlchtdj/feedbox/internal/database/common"
	"github.com/dhcmrlchtdj/feedbox/internal/database/sqlite"
	"github.com/pkg/errors"
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

var defaultImpl atomic.Pointer[Database]

func Default() Database {
	return *defaultImpl.Load()
}

func Init(c Database) {
	defaultImpl.Store(&c)
}

///

func Close() {
	Default().Close()
}

func GetUserByID(ctx context.Context, id int64) (*User, error) {
	return Default().GetUserByID(ctx, id)
}

func GetOrCreateUserByGithub(ctx context.Context, githubID string, email string) (*User, error) {
	return Default().GetOrCreateUserByGithub(ctx, githubID, email)
}

func GetOrCreateUserByTelegram(ctx context.Context, chatID string) (*User, error) {
	return Default().GetOrCreateUserByTelegram(ctx, chatID)
}

func GetFeedIDByURL(ctx context.Context, url string) (int64, error) {
	return Default().GetFeedIDByURL(ctx, url)
}

func GetFeedByUser(ctx context.Context, userID int64, orderBy string) ([]Feed, error) {
	return Default().GetFeedByUser(ctx, userID, orderBy)
}

func GetActiveFeeds(ctx context.Context) ([]Feed, error) {
	return Default().GetActiveFeeds(ctx)
}

func AddFeedLinks(ctx context.Context, id int64, links []string, updated *time.Time, etag string) error {
	return Default().AddFeedLinks(ctx, id, links, updated, etag)
}

func SetFeedUpdated(ctx context.Context, id int64, updated *time.Time, etag string) error {
	return Default().SetFeedUpdated(ctx, id, updated, etag)
}

func GetLinks(ctx context.Context, feedID int64) ([]string, error) {
	return Default().GetLinks(ctx, feedID)
}

func GetSubscribers(ctx context.Context, feedID int64) ([]User, error) {
	return Default().GetSubscribers(ctx, feedID)
}

func Subscribe(ctx context.Context, userID int64, feedID int64) error {
	return Default().Subscribe(ctx, userID, feedID)
}

func Unsubscribe(ctx context.Context, userID int64, feedID int64) error {
	return Default().Unsubscribe(ctx, userID, feedID)
}

func UnsubscribeAll(ctx context.Context, userID int64) error {
	return Default().UnsubscribeAll(ctx, userID)
}

func SubscribeURL(ctx context.Context, userID int64, url string) error {
	return Default().SubscribeURL(ctx, userID, url)
}

func SubscribeURLs(ctx context.Context, userID int64, urls []string) error {
	return Default().SubscribeURLs(ctx, userID, urls)
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
		r, err := sqlite.New(ctx, uri)
		return r, errors.WithStack(err)
	}

	return nil, errors.New("unknown database url")
}
