package postgresql

import (
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/database/common"
	"github.com/dhcmrlchtdj/feedbox/internal/util"
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

func (db *Database) GetUserByID(id int64) (*User, error) {
	row := db.QueryRow(
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
		return nil, ErrEmptyRow
	}

	return user, nil
}

func (db *Database) GetOrCreateUserByGithub(githubID string, email string) (*User, error) {
	addition := map[string]string{"email": email}
	row := db.QueryRow(
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

func (db *Database) GetOrCreateUserByTelegram(chatID string) (*User, error) {
	row := db.QueryRow(
		`WITH new_user AS (
			INSERT INTO users(platform, pid)
			VALUES ('telegram', $1)
			ON CONFLICT DO NOTHING
			RETURNING id, platform, pid, addition
		)
		SELECT id, platform, pid, addition
		FROM users WHERE platform='telegram' AND pid=$1
		UNION ALL
		SELECT id, platform, pid, addition FROM new_user`,
		chatID,
	)

	user, err := readUser(row)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (db *Database) GetFeedIDByURL(url string) (int64, error) {
	if !util.IsValidURL(url) {
		return 0, ErrInvalidURL
	}

	row := db.QueryRow(
		`WITH
		new_id AS (
			INSERT INTO feeds(url) VALUES ($1)
			ON CONFLICT DO NOTHING
			RETURNING id
		)
		SELECT id FROM feeds WHERE url=$1
		UNION ALL
		SELECT id from new_id`,
		url,
	)

	var feedID int64
	err := row.Scan(&feedID)
	if err != nil {
		return 0, err
	}

	return feedID, nil
}

func (db *Database) GetFeedByUser(userID int64, orderBy string) ([]Feed, error) {
	query := `SELECT id, url, updated
		FROM feeds
		WHERE EXISTS
		(SELECT 1 FROM r_user_feed WHERE user_id=$1 AND feed_id=feeds.id)`

	switch orderBy {
	case "updated":
		query += " ORDER BY updated DESC NULLS FIRST, url ASC"
	case "url":
		query += " ORDER BY url ASC"
	}

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return readFeeds(rows)
}

func (db *Database) GetActiveFeeds() ([]Feed, error) {
	rows, err := db.Query(
		`SELECT id, url, updated
		FROM feeds
		WHERE EXISTS
		(SELECT 1 FROM r_user_feed WHERE feed_id=feeds.id)`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return readFeeds(rows)
}

func (db *Database) AddFeedLinks(id int64, links []string, updated *time.Time) error {
	_, err := db.Exec(
		`WITH
		new_link_id AS (
			INSERT INTO links(url)
			SELECT unnest($2::TEXT[])
			ON CONFLICT DO NOTHING
			RETURNING id
		),
		all_link_id AS (
			SELECT id FROM links WHERE url=ANY($2::TEXT[])
			UNION ALL
			SELECT id from new_link_id
		),
		relation AS (
			INSERT INTO r_feed_link(feed_id, link_id)
			SELECT $1, id from all_link_id
			ON CONFLICT DO NOTHING
		)
		UPDATE feeds
		SET updated=$3
		WHERE id=$1
		`,
		id,
		links,
		updated,
	)
	return err
}

func (db *Database) SetFeedUpdated(id int64, updated *time.Time) error {
	if updated == nil {
		return nil
	}

	_, err := db.Exec(
		`UPDATE feeds SET updated=$2 WHERE id=$1`,
		id,
		updated,
	)
	if err != nil {
		return err
	}

	return nil
}

func (db *Database) GetLinks(feedID int64) ([]string, error) {
	rows, err := db.Query(
		`SELECT url FROM links
		JOIN r_feed_link r ON r.link_id=links.id
		WHERE r.feed_id=$1`,
		feedID,
	)
	if err != nil {
		return nil, err
	}
	links, err := readLinks(rows)
	if err != nil {
		return nil, err
	}
	return links, nil
}

func (db *Database) GetSubscribers(feedID int64) ([]User, error) {
	rows, err := db.Query(
		`SELECT id, platform, pid, addition
		FROM users
		WHERE EXISTS
		(SELECT 1 FROM r_user_feed WHERE feed_id=$1 AND user_id=users.id)`,
		feedID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return readUsers(rows)
}

func (db *Database) Subscribe(userID int64, feedID int64) error {
	_, err := db.Exec(
		`INSERT INTO r_user_feed(user_id, feed_id)
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING`,
		userID,
		feedID,
	)
	return err
}

func (db *Database) Unsubscribe(userID int64, feedID int64) error {
	_, err := db.Exec(
		`DELETE FROM r_user_feed
		WHERE user_id=$1 AND feed_id=$2`,
		userID,
		feedID,
	)
	return err
}

func (db *Database) UnsubscribeAll(userID int64) error {
	_, err := db.Exec("DELETE FROM r_user_feed WHERE user_id=$1", userID)
	return err
}

func (db *Database) SubscribeURL(userID int64, url string) error {
	feedID, err := db.GetFeedIDByURL(url)
	if err != nil {
		return err
	}

	return db.Subscribe(userID, feedID)
}

func (db *Database) SubscribeURLs(userID int64, urls []string) error {
	if len(urls) == 0 {
		return nil
	}

	for _, u := range urls {
		if !util.IsValidURL(u) {
			return errors.Wrap(ErrInvalidURL, u)
		}
	}

	_, err := db.Exec(
		`INSERT INTO feeds(url)
		SELECT unnest($1::TEXT[])
		ON CONFLICT DO NOTHING`,
		urls,
	)
	if err != nil {
		return err
	}

	_, err = db.Exec(
		`WITH fids AS (
			SELECT id AS fid
			FROM feeds
			WHERE url=ANY($1::TEXT[])
		)
		INSERT INTO r_user_feed(user_id, feed_id)
		SELECT $2 AS uid, fid FROM fids
		ON CONFLICT DO NOTHING`,
		urls,
		userID,
	)
	if err != nil {
		return err
	}

	return nil
}

///

func readUser(row pgx.Row) (*User, error) {
	var user User
	err := row.Scan(&user.ID, &user.Platform, &user.PID, &user.Addition)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func readUsers(rows pgx.Rows) ([]User, error) {
	users := []User{}
	for rows.Next() {
		var user User
		err := rows.Scan(&user.ID, &user.Platform, &user.PID, &user.Addition)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, nil
}

func readFeeds(rows pgx.Rows) ([]Feed, error) {
	feeds := []Feed{}
	for rows.Next() {
		var feed Feed
		err := rows.Scan(&feed.ID, &feed.URL, &feed.Updated)
		if err != nil {
			return nil, err
		}
		feeds = append(feeds, feed)
	}
	return feeds, nil
}

func readLinks(rows pgx.Rows) ([]string, error) {
	links := []string{}
	for rows.Next() {
		var link string
		err := rows.Scan(&link)
		if err != nil {
			return nil, err
		}
		links = append(links, link)
	}
	return links, nil
}
