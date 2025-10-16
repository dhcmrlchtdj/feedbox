package sqlite

import (
	"context"
	"database/sql"
	"encoding/json"
	netUrl "net/url"
	"time"

	_ "github.com/ncruces/go-sqlite3/driver"
	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/database/common"
)

type (
	User = common.User
	Feed = common.Feed
)

var (
	ErrEmptyRow   = common.ErrEmptyRow
	ErrInvalidURL = common.ErrInvalidURL
)

///

func (db *Database) GetUserByID(ctx context.Context, id int64) (*User, error) {
	row := db.QueryRow(
		ctx,
		`SELECT id, platform, pid, addition
		FROM users
		WHERE id=$1`,
		id,
	)
	user, err := readUser(row)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.WithStack(ErrEmptyRow)
	}

	return user, nil
}

func (db *Database) GetOrCreateUserByGithub(ctx context.Context, githubID string, email string) (*User, error) {
	addition, err := json.Marshal(map[string]string{"email": email})
	if err != nil {
		return nil, errors.WithStack(err)
	}
	row := db.QueryRow(
		ctx,
		`INSERT INTO users(platform, pid, addition)
		VALUES ('github', $1, $2)
		ON CONFLICT(platform, pid) DO UPDATE SET addition=EXCLUDED.addition
		RETURNING id, platform, pid, addition`,
		githubID,
		addition,
	)
	user, err := readUser(row)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (db *Database) GetOrCreateUserByTelegram(ctx context.Context, chatID string) (*User, error) {
	_, err := db.Exec(
		ctx,
		`INSERT OR IGNORE INTO users(platform, pid)
		VALUES ('telegram', $1)`,
		chatID,
	)
	if err != nil {
		return nil, err
	}

	row := db.QueryRow(
		ctx,
		`SELECT id, platform, pid, addition
		FROM users
		WHERE platform='telegram' AND pid=$1`,
		chatID,
	)

	user, err := readUser(row)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (db *Database) GetFeedIDByURL(ctx context.Context, url string) (int64, error) {
	if !isValidURL(url) {
		return 0, errors.WithStack(ErrInvalidURL)
	}

	_, err := db.Exec(ctx, `INSERT OR IGNORE INTO feeds(url) VALUES ($1)`, url)
	if err != nil {
		return 0, err
	}

	row := db.QueryRow(ctx, `SELECT id FROM feeds WHERE url=$1`, url)

	var feedID int64
	err = row.Scan(&feedID)
	if err != nil {
		return 0, errors.WithStack(err)
	}

	return feedID, nil
}

func (db *Database) GetFeedByUser(ctx context.Context, userID int64, orderBy string) ([]Feed, error) {
	query := `SELECT feeds.id, feeds.url, feeds.updated, feeds.etag
	FROM feeds
	INNER JOIN r_user_feed ON r_user_feed.feed_id = feeds.id
	WHERE r_user_feed.user_id = $1`

	switch orderBy {
	case "updated":
		query += " ORDER BY updated DESC NULLS FIRST, url ASC"
	case "url":
		query += " ORDER BY url ASC"
	default:
		panic("unreachable")
	}

	rows, err := db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return readFeeds(rows)
}

func (db *Database) GetActiveFeeds(ctx context.Context) ([]Feed, error) {
	rows, err := db.Query(
		ctx,
		`SELECT DISTINCT feeds.id, feeds.url, feeds.updated, feeds.etag
		FROM feeds
		INNER JOIN r_user_feed
		ON r_user_feed.feed_id = feeds.id`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return readFeeds(rows)
}

func (db *Database) AddFeedLinks(ctx context.Context, id int64, links []string, updated *time.Time, etag string) error {
	var err error

	for _, url := range links {
		_, err = db.Exec(ctx, "INSERT OR IGNORE INTO links(url) VALUES ($1)", url)
		if err != nil {
			return err
		}

		row := db.QueryRow(ctx, `SELECT id FROM links WHERE url=$1`, url)
		var linkID int64
		err = row.Scan(&linkID)
		if err != nil {
			return errors.WithStack(err)
		}

		_, err = db.Exec(
			ctx,
			`INSERT OR IGNORE INTO r_feed_link(feed_id, link_id) VALUES ($1, $2)`,
			id,
			linkID,
		)
		if err != nil {
			return err
		}
	}

	err = db.SetFeedUpdated(ctx, id, updated, etag)
	if err != nil {
		return err
	}

	return nil
}

func (db *Database) SetFeedUpdated(ctx context.Context, id int64, updated *time.Time, etag string) error {
	if updated == nil {
		return nil
	}

	_, err := db.Exec(
		ctx,
		`UPDATE feeds SET updated=$2, etag=$3 WHERE id=$1`,
		id,
		updated.UnixMilli(),
		etag,
	)
	if err != nil {
		return err
	}

	return nil
}

func (db *Database) GetLinks(ctx context.Context, feedID int64) ([]string, error) {
	rows, err := db.Query(
		ctx,
		`SELECT url FROM links
		JOIN r_feed_link r ON r.link_id=links.id
		WHERE r.feed_id=$1`,
		feedID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	links, err := readLinks(rows)
	if err != nil {
		return nil, err
	}
	return links, nil
}

func (db *Database) GetSubscribers(ctx context.Context, feedID int64) ([]User, error) {
	rows, err := db.Query(
		ctx,
		`SELECT users.id, users.platform, users.pid, users.addition
		FROM users
		INNER JOIN r_user_feed ON r_user_feed.user_id = users.id
		WHERE r_user_feed.feed_id = $1`,
		feedID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return readUsers(rows)
}

func (db *Database) Subscribe(ctx context.Context, userID int64, feedID int64) error {
	_, err := db.Exec(
		ctx,
		"INSERT OR IGNORE INTO r_user_feed(user_id, feed_id) VALUES ($1, $2)",
		userID,
		feedID,
	)
	return err
}

func (db *Database) Unsubscribe(ctx context.Context, userID int64, feedID int64) error {
	_, err := db.Exec(
		ctx,
		`DELETE FROM r_user_feed
		WHERE user_id=$1 AND feed_id=$2`,
		userID,
		feedID,
	)
	return err
}

func (db *Database) UnsubscribeAll(ctx context.Context, userID int64) error {
	_, err := db.Exec(ctx, "DELETE FROM r_user_feed WHERE user_id=$1", userID)
	return err
}

func (db *Database) SubscribeURL(ctx context.Context, userID int64, url string) error {
	feedID, err := db.GetFeedIDByURL(ctx, url)
	if err != nil {
		return err
	}

	return db.Subscribe(ctx, userID, feedID)
}

func (db *Database) SubscribeURLs(ctx context.Context, userID int64, urls []string) error {
	if len(urls) == 0 {
		return nil
	}

	for _, url := range urls {
		err := db.SubscribeURL(ctx, userID, url)
		if err != nil {
			return err
		}
	}

	return nil
}

///

func readUser(row *sql.Row) (*User, error) {
	var user User
	var addition []byte

	err := row.Scan(&user.ID, &user.Platform, &user.PID, &addition)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, errors.WithStack(err)
	}

	err = json.Unmarshal(addition, &user.Addition)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	return &user, nil
}

func readUsers(rows *sql.Rows) ([]User, error) {
	users := []User{}
	for rows.Next() {
		var user User
		var addition []byte
		err := rows.Scan(&user.ID, &user.Platform, &user.PID, &addition)
		if err != nil {
			return nil, errors.WithStack(err)
		}
		err = json.Unmarshal(addition, &user.Addition)
		if err != nil {
			return nil, errors.WithStack(err)
		}
		users = append(users, user)
	}
	return users, nil
}

func readFeeds(rows *sql.Rows) ([]Feed, error) {
	feeds := []Feed{}
	for rows.Next() {
		var feed Feed
		var ts *int64
		err := rows.Scan(&feed.ID, &feed.URL, &ts, &feed.ETag)
		if err != nil {
			return nil, errors.WithStack(err)
		}
		feed.Updated = parseTime(ts)
		feeds = append(feeds, feed)
	}
	return feeds, nil
}

func parseTime(msec *int64) *time.Time {
	var updated time.Time
	if msec != nil {
		updated = time.UnixMilli(*msec)
		return &updated
	}
	return nil
}

func readLinks(rows *sql.Rows) ([]string, error) {
	links := []string{}
	for rows.Next() {
		var link string
		err := rows.Scan(&link)
		if err != nil {
			return nil, errors.WithStack(err)
		}
		links = append(links, link)
	}
	return links, nil
}

func isValidURL(link string) bool {
	u, err := netUrl.Parse(link)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return false
	}
	return true
}
