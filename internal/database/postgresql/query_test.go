package postgresql_test

import (
	"os"
	"strings"
	"testing"
	"time"

	"github.com/bradleyjkemp/cupaloy/v2"
	"github.com/golang-migrate/migrate/v4"
	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"

	"github.com/dhcmrlchtdj/feedbox/internal/database/postgresql"
	"github.com/dhcmrlchtdj/feedbox/migration"
)

var db *postgresql.Database

func TestMain(m *testing.M) {
	if err := godotenv.Load("../../../dotenv"); err != nil {
		panic(err)
	}
	if !strings.HasPrefix(os.Getenv("DATABASE_URL"), "postgres://") {
		return
	}

	code := func() int {
		setupDatabase()

		var err error
		db, err = postgresql.New(os.Getenv("DATABASE_URL"), &log.Logger)
		if err != nil {
			panic(err)
		}
		defer db.Close()

		return m.Run()
	}()

	os.Exit(code)
}

func setupDatabase() {
	m, err := migration.InitMigration(os.Getenv("DATABASE_URL"))
	if err != nil {
		panic(err)
	}
	defer m.Close()

	if err := m.Down(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		panic(err)
	}
	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		panic(err)
	}
}

func TestGetOrCreateUserByGithub(t *testing.T) {
	r, err := db.GetOrCreateUserByGithub("123", "email@example.com")
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestGetOrCreateUserByTelegram(t *testing.T) {
	r, err := db.GetOrCreateUserByTelegram("321")
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestGetUserByID(t *testing.T) {
	t.Run("uid1", func(t *testing.T) {
		r, err := db.GetUserByID(1)
		if err != nil {
			t.Fatal(err)
		}
		cupaloy.SnapshotT(t, r)
	})
	t.Run("uid2", func(t *testing.T) {
		r, err := db.GetUserByID(2)
		if err != nil {
			t.Fatal(err)
		}
		cupaloy.SnapshotT(t, r)
	})
}

func TestGetFeedIDByURL(t *testing.T) {
	t.Run("add feed", func(t *testing.T) {
		r, err := db.GetFeedIDByURL("http://rss.example.com")
		if err != nil {
			t.Fatal(err)
		}
		cupaloy.SnapshotT(t, r)
	})
	t.Run("get feed", func(t *testing.T) {
		r, err := db.GetFeedIDByURL("http://rss.example.com")
		if err != nil {
			t.Fatal(err)
		}
		cupaloy.SnapshotT(t, r)
	})
}

func TestAddFeedLinks(t *testing.T) {
	type feedAll struct {
		ID      int64
		URL     string
		Updated *time.Time
		Link    string
	}

	readFeedAll := func(rows pgx.Rows) ([]feedAll, error) {
		feeds := []feedAll{}
		for rows.Next() {
			var feed feedAll
			err := rows.Scan(&feed.ID, &feed.URL, &feed.Updated, &feed.Link)
			if err != nil {
				return nil, err
			}
			feeds = append(feeds, feed)
		}
		return feeds, nil
	}

	t.Run("time1", func(t *testing.T) {
		time1 := time.Date(2000, time.January, 1, 0, 0, 0, 0, time.UTC)
		err := db.AddFeedLinks(
			1,
			[]string{"http://rss.example.com/1", "http://rss.example.com/2", "http://rss.example.com/3"},
			&time1)
		if err != nil {
			t.Fatal(err)
		}

		rows, err := db.Query(
			`SELECT f.id, f.url, f.updated, l.url
			FROM feeds f
			JOIN r_feed_link r ON r.feed_id=f.id
			JOIN links l ON l.id = r.link_id
			WHERE f.id=$1`,
			1)
		if err != nil {
			t.Fatal(err)
		}

		r, err := readFeedAll(rows)
		if err != nil {
			t.Fatal(err)
		}
		cupaloy.SnapshotT(t, r)
	})
	t.Run("time2", func(t *testing.T) {
		time2 := time.Date(2020, time.January, 1, 0, 0, 0, 0, time.UTC)
		err := db.AddFeedLinks(
			1,
			[]string{"http://rss.example.com/x", "http://rss.example.com/y", "http://rss.example.com/3"},
			&time2)
		if err != nil {
			t.Fatal(err)
		}

		rows, err := db.Query(
			`SELECT f.id, f.url, f.updated, l.url
			FROM feeds f
			JOIN r_feed_link r ON r.feed_id=f.id
			JOIN links l ON l.id = r.link_id
			WHERE f.id=$1`,
			1)
		if err != nil {
			t.Fatal(err)
		}

		r, err := readFeedAll(rows)
		if err != nil {
			t.Fatal(err)
		}
		cupaloy.SnapshotT(t, r)
	})
}

func TestGetLinks(t *testing.T) {
	r, err := db.GetLinks(1)
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestSubscribe(t *testing.T) {
	err := db.Subscribe(1, 1)
	if err != nil {
		t.Fatal(err)
	}
	r, err := db.GetFeedByUser(1, "updated")
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestSubscribeURLs(t *testing.T) {
	err := db.SubscribeURLs(1, []string{"http://rss.example.com", "http://atom.example.com"})
	if err != nil {
		t.Fatal(err)
	}
	r, err := db.GetFeedByUser(1, "updated")
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestGetFeedByUser(t *testing.T) {
	r, err := db.GetFeedByUser(1, "updated")
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestGetActiveFeeds(t *testing.T) {
	r, err := db.GetActiveFeeds()
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestGetSubscribers(t *testing.T) {
	r, err := db.GetSubscribers(1)
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestUnsubscribe(t *testing.T) {
	err := db.Unsubscribe(1, 1)
	if err != nil {
		t.Fatal(err)
	}
	r, err := db.GetFeedByUser(1, "updated")
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestUnsubscribeAll(t *testing.T) {
	err := db.UnsubscribeAll(1)
	if err != nil {
		t.Fatal(err)
	}
	r, err := db.GetFeedByUser(1, "updated")
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}
