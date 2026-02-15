package sqlite_test

import (
	"context"
	"database/sql"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/bradleyjkemp/cupaloy/v2"
	"github.com/golang-migrate/migrate/v4"
	"github.com/joho/godotenv"
	"github.com/pkg/errors"
	"github.com/rs/zerolog"

	"github.com/dhcmrlchtdj/feedbox/internal/database/sqlite"
	"github.com/dhcmrlchtdj/feedbox/migration"
)

var (
	db     *sqlite.Database
	logger = zerolog.New(os.Stderr).With().Timestamp().Logger()
	ctx    = logger.WithContext(context.Background())
)

func TestMain(m *testing.M) {
	if err := godotenv.Load("../../../dotenv"); err != nil {
		panic(err)
	}
	if !strings.HasPrefix(os.Getenv("DATABASE_URL"), "sqlite://") {
		return
	}

	setupDatabase()

	var err error
	db, err = sqlite.New(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		panic(err)
	}
	defer db.Close()

	m.Run()
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
	r, err := db.GetOrCreateUserByGithub(ctx, "123", "email@example.com")
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestGetOrCreateUserByTelegram(t *testing.T) {
	r, err := db.GetOrCreateUserByTelegram(ctx, "321")
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestGetUserByID(t *testing.T) {
	t.Run("uid1", func(t *testing.T) {
		r, err := db.GetUserByID(ctx, 1)
		if err != nil {
			t.Fatal(err)
		}
		cupaloy.SnapshotT(t, r)
	})
	t.Run("uid2", func(t *testing.T) {
		r, err := db.GetUserByID(ctx, 2)
		if err != nil {
			t.Fatal(err)
		}
		cupaloy.SnapshotT(t, r)
	})
}

func TestGetFeedIDByURL(t *testing.T) {
	t.Run("add feed", func(t *testing.T) {
		r, err := db.GetFeedIDByURL(ctx, "http://rss.example.com")
		if err != nil {
			t.Fatal(err)
		}
		cupaloy.SnapshotT(t, r)
	})
	t.Run("get feed", func(t *testing.T) {
		r, err := db.GetFeedIDByURL(ctx, "http://rss.example.com")
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
		Updated int64
		ETag    string
		Link    string
	}

	readFeedAll := func(rows *sql.Rows) ([]feedAll, error) {
		feeds := []feedAll{}
		for rows.Next() {
			var feed feedAll
			err := rows.Scan(&feed.ID, &feed.URL, &feed.Updated, &feed.ETag, &feed.Link)
			if err != nil {
				return nil, errors.WithStack(err)
			}
			feeds = append(feeds, feed)
		}
		return feeds, nil
	}

	t.Run("time1", func(t *testing.T) {
		time1 := time.Date(2000, time.January, 1, 0, 0, 0, 0, time.UTC)
		err := db.AddFeedLinks(
			ctx,
			1,
			[]string{"http://rss.example.com/1", "http://rss.example.com/2", "http://rss.example.com/3"},
			&time1,
			"etag1")
		if err != nil {
			t.Fatal(err)
		}

		rows, err := db.Query(
			ctx,
			`SELECT f.id, f.url, f.updated, f.etag, l.url
			FROM feeds f
			JOIN r_feed_link r ON r.feed_id=f.id
			JOIN links l ON l.id = r.link_id
			WHERE f.id=$1`,
			1)
		if err != nil {
			t.Fatal(err)
		}
		if rows.Err() != nil {
			t.Fatal(rows.Err())
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
			ctx,
			1,
			[]string{"http://rss.example.com/x", "http://rss.example.com/y", "http://rss.example.com/3"},
			&time2,
			"etag2")
		if err != nil {
			t.Fatal(err)
		}

		rows, err := db.Query(
			ctx,
			`SELECT f.id, f.url, f.updated, f.etag, l.url
			FROM feeds f
			JOIN r_feed_link r ON r.feed_id=f.id
			JOIN links l ON l.id = r.link_id
			WHERE f.id=$1`,
			1)
		if err != nil {
			t.Fatal(err)
		}
		if rows.Err() != nil {
			t.Fatal(rows.Err())
		}

		r, err := readFeedAll(rows)
		if err != nil {
			t.Fatal(err)
		}
		cupaloy.SnapshotT(t, r)
	})
}

func TestGetLinks(t *testing.T) {
	r, err := db.GetLinks(ctx, 1)
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestSubscribe(t *testing.T) {
	err := db.Subscribe(ctx, 1, 1)
	if err != nil {
		t.Fatal(err)
	}
	r, err := db.GetFeedByUser(ctx, 1, "updated")
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestSubscribeURLs(t *testing.T) {
	err := db.SubscribeURLs(ctx, 1, []string{"http://rss.example.com", "http://atom.example.com"})
	if err != nil {
		t.Fatal(err)
	}
	r, err := db.GetFeedByUser(ctx, 1, "updated")
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestGetFeedByUser(t *testing.T) {
	r, err := db.GetFeedByUser(ctx, 1, "updated")
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestGetActiveFeeds(t *testing.T) {
	r, err := db.GetActiveFeeds(ctx)
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestGetSubscribers(t *testing.T) {
	r, err := db.GetSubscribers(ctx, 1)
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestUnsubscribe(t *testing.T) {
	err := db.Unsubscribe(ctx, 1, 1)
	if err != nil {
		t.Fatal(err)
	}
	r, err := db.GetFeedByUser(ctx, 1, "updated")
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestUnsubscribeAll(t *testing.T) {
	err := db.UnsubscribeAll(ctx, 1)
	if err != nil {
		t.Fatal(err)
	}
	r, err := db.GetFeedByUser(ctx, 1, "updated")
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}

func TestQueue(t *testing.T) {
	err := db.PushTask(ctx, "tg", "1")
	if err != nil {
		t.Fatal(err)
	}
	err = db.PushTask(ctx, "email", "2")
	if err != nil {
		t.Fatal(err)
	}

	t.Run("pop all", func(t *testing.T) {
		tasks, err := db.PopTasks(ctx)
		if err != nil {
			t.Fatal(err)
		}
		cupaloy.SnapshotT(t, tasks)
	})

	t.Run("pop empty", func(t *testing.T) {
		tasks, err := db.PopTasks(ctx)
		if err != nil {
			t.Fatal(err)
		}
		cupaloy.SnapshotT(t, tasks)
	})
}
