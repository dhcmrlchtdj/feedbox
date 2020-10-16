package database_test

import (
	"os"
	"testing"
	"time"

	"github.com/bradleyjkemp/cupaloy/v2"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
)

var db *database.Database

func TestMain(m *testing.M) {
	if err := godotenv.Load("../../dotenv"); err != nil {
		panic(err)
	}

	setupDatabase()
	var err error
	db, err = database.New(os.Getenv("DATABASE_URL"))
	if err != nil {
		panic(err)
	}
	defer db.Close()

	os.Exit(m.Run())
}

func setupDatabase() {
	m, err := migrate.New("file://../../migration", os.Getenv("DATABASE_URL"))
	if err != nil {
		panic(err)
	}
	if err := m.Down(); err != nil && err != migrate.ErrNoChange {
		panic(err)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		panic(err)
	}
	err1, err2 := m.Close()
	if err1 != nil {
		panic(err1)
	}
	if err2 != nil {
		panic(err2)
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
		Link    []string
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
		r := feedAll{}
		row := db.QueryRow("select id, url, updated, link from feeds where id=$1", 1)
		err = row.Scan(&r.ID, &r.URL, &r.Updated, &r.Link)
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
		r := feedAll{}
		row := db.QueryRow("select id, url, updated, link from feeds where id=$1", 1)
		err = row.Scan(&r.ID, &r.URL, &r.Updated, &r.Link)
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
}

func TestSubscribeURLs(t *testing.T) {
	err := db.SubscribeURLs(1, []string{"http://rss.example.com", "http://atom.example.com"})
	if err != nil {
		t.Fatal(err)
	}
}

func TestGetFeedByUser(t *testing.T) {
	r, err := db.GetFeedByUser(1)
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
	r, err := db.GetFeedByUser(1)
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
	r, err := db.GetFeedByUser(1)
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, r)
}
