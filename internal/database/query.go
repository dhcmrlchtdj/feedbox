package database

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v4"
	"github.com/pkg/errors"
)

///

var (
	ErrEmptyRow   = errors.New("empty row")
	ErrInvalidURL = errors.New("invalid url")
)

///

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

///

func (db *Database) GetUserByID(id int64) (*User, error) {
	key := fmt.Sprintf("%v-%v", "GetUserByID", id)
	if v, ok := db.cache.Load(key); ok {
		return v.(*User), nil
	}

	row := db.pool.QueryRow(
		context.Background(),
		"SELECT id, platform, pid, addition FROM users WHERE id = $1",
		id)
	user, err := readUser(row)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrEmptyRow
	}

	db.cache.Store(key, user)
	return user, nil
}

func (db *Database) GetFeedIDByURL(url string) (int64, error) {
	if !isValidURL(url) {
		return 0, ErrInvalidURL
	}

	key := fmt.Sprintf("%v-%v", "GetFeedIDByURL", url)
	if v, ok := db.cache.Load(key); ok {
		return v.(int64), nil
	}

	tx, err := db.pool.Begin(context.Background())
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(context.Background())

	var feedID int64
	row := tx.QueryRow(context.Background(), "SELECT id FROM feeds WHERE url=$1", url)
	err = row.Scan(&feedID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			row = tx.QueryRow(context.Background(), "INSERT INTO feeds(url) VALUES ($1) RETURNING id", url)
			err = row.Scan(&feedID)
			if err != nil {
				return 0, err
			}
		} else {
			return 0, err
		}
	}

	err = tx.Commit(context.Background())
	if err != nil {
		return 0, err
	}

	db.cache.Store(key, feedID)
	return feedID, nil
}

func (db *Database) GetOrCreateUserByGithub(githubID string, email string) (*User, error) {
	key := fmt.Sprintf("%v-%v-%v", "GetOrCreateUserByGithub", githubID, email)
	if v, ok := db.cache.Load(key); ok {
		return v.(*User), nil
	}

	tx, err := db.pool.Begin(context.Background())
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(context.Background())

	row := tx.QueryRow(
		context.Background(),
		`SELECT id, platform, pid, addition FROM users WHERE platform = 'github' AND pid = $1`,
		githubID)
	user, err := readUser(row)
	if err != nil {
		return nil, err
	}

	if user == nil || user.Addition["email"] != email {
		addition := map[string]string{"email": email}
		additionJSON, err := json.Marshal(addition)
		if err != nil {
			return nil, err
		}

		if user == nil {
			row = tx.QueryRow(
				context.Background(),
				"INSERT INTO users(platform, pid, addition) VALUES ('github', $1, $2) RETURNING id, platform, pid, addition",
				githubID, additionJSON)
			user, err = readUser(row)
		} else {
			_, err = tx.Exec(
				context.Background(),
				"UPDATE users SET addition = $2 WHERE id = $1",
				user.ID, additionJSON)
			user.Addition["email"] = email
		}
		if err != nil {
			return nil, err
		}
	}

	err = tx.Commit(context.Background())
	if err != nil {
		return nil, err
	}

	db.cache.Store(key, user)
	return user, nil
}

func (db *Database) GetOrCreateUserByTelegram(chatID string) (*User, error) {
	key := fmt.Sprintf("%v-%v", "GetOrCreateUserByTelegram", chatID)
	if v, ok := db.cache.Load(key); ok {
		return v.(*User), nil
	}

	tx, err := db.pool.Begin(context.Background())
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(context.Background())

	row := tx.QueryRow(
		context.Background(),
		`SELECT id, platform, pid, addition FROM users WHERE platform = 'telegram' AND pid = $1`,
		chatID)
	user, err := readUser(row)
	if err != nil {
		return nil, err
	}

	if user == nil {
		row = tx.QueryRow(
			context.Background(),
			"INSERT INTO users(platform, pid) VALUES ('telegram', $1) RETURNING id, platform, pid, addition",
			chatID)
		user, err = readUser(row)
		if err != nil {
			return nil, err
		}
	}

	err = tx.Commit(context.Background())
	if err != nil {
		return nil, err
	}

	db.cache.Store(key, user)
	return user, nil
}

func (db *Database) GetFeedByUser(userID int64) ([]Feed, error) {
	rows, err := db.pool.Query(
		context.Background(),
		"SELECT id, url, updated FROM feeds WHERE id IN (SELECT fid FROM r_user_feed WHERE uid = $1) ORDER BY updated DESC",
		userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return readFeeds(rows)
}

func (db *Database) GetActiveFeeds() ([]Feed, error) {
	rows, err := db.pool.Query(
		context.Background(),
		"SELECT id, url, updated FROM feeds WHERE id IN (SELECT fid FROM r_user_feed)")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return readFeeds(rows)
}

func (db *Database) AddFeedLinks(id int64, links []string, updated *time.Time) error {
	_, err := db.pool.Exec(
		context.Background(),
		"UPDATE feeds SET link=array_cat($1::varchar[], link), updated=$2 WHERE id=$3",
		links, updated, id)
	return err
}

func (db *Database) GetLinks(feedID int64) ([]string, error) {
	var links []string
	row := db.pool.QueryRow(context.Background(), "SELECT link FROM feeds WHERE id=$1", feedID)
	err := row.Scan(&links)
	if err != nil {
		return nil, err
	}
	return links, nil
}

func (db *Database) GetSubscribers(feedID int64) ([]User, error) {
	rows, err := db.pool.Query(
		context.Background(),
		"SELECT id, platform, pid, addition FROM users WHERE id IN (SELECT uid FROM r_user_feed WHERE fid = $1)",
		feedID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return readUsers(rows)
}

func (db *Database) Subscribe(userID int64, feedID int64) error {
	_, err := db.pool.Exec(
		context.Background(),
		"INSERT INTO r_user_feed(uid, fid) VALUES ($1, $2) ON CONFLICT DO NOTHING",
		userID, feedID)
	return err
}

func (db *Database) Unsubscribe(userID int64, feedID int64) error {
	_, err := db.pool.Exec(
		context.Background(),
		"DELETE FROM r_user_feed WHERE uid = $1 AND fid = $2",
		userID, feedID)
	return err
}

func (db *Database) UnsubscribeAll(userID int64) error {
	_, err := db.pool.Exec(context.Background(), "DELETE FROM r_user_feed WHERE uid = $1", userID)
	return err
}

func (db *Database) SubscribeURLs(userID int64, urls []string) error {
	if len(urls) == 0 {
		return nil
	}

	for _, u := range urls {
		if !isValidURL(u) {
			return errors.Wrap(ErrInvalidURL, u)
		}
	}

	_, err := db.pool.Exec(
		context.Background(),
		"INSERT INTO feeds(url) SELECT unnest($1::varchar[]) EXCEPT SELECT url FROM feeds",
		urls)
	if err != nil {
		return err
	}

	_, err = db.pool.Exec(
		context.Background(),
		`WITH fids AS (SELECT id AS fid FROM feeds WHERE url = ANY($1::varchar[]))
		INSERT INTO r_user_feed(uid, fid) SELECT $2 AS uid, fid FROM fids ON CONFLICT DO NOTHING`,
		urls, userID)
	if err != nil {
		return err
	}

	return nil
}

func (db *Database) QueryRow(sql string, args ...interface{}) pgx.Row {
	return db.pool.QueryRow(context.Background(), sql, args...)
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
