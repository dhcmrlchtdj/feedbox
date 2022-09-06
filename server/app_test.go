package server_test

import (
	"bytes"
	"io"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/bradleyjkemp/cupaloy/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-migrate/migrate/v4"
	"github.com/joho/godotenv"
	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/multipart"
	"github.com/dhcmrlchtdj/feedbox/internal/sign"
	"github.com/dhcmrlchtdj/feedbox/migration"
	"github.com/dhcmrlchtdj/feedbox/server/handler"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/github"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/mock"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/validate"
	"github.com/dhcmrlchtdj/feedbox/server/types"
)

var app *fiber.App

func TestMain(m *testing.M) {
	if err := godotenv.Load("../dotenv"); err != nil {
		panic(err)
	}

	code := func() int {
		setupDatabase()
		defer cleanupDatabase()

		var err error

		database.C, err = database.New(os.Getenv("DATABASE_URL"), nil)
		if err != nil {
			panic(err)
		}
		defer database.C.Close()

		sign.S, err = sign.New(os.Getenv("COOKIE_PASSWORD"))
		if err != nil {
			panic(err)
		}

		setupApp()

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

func cleanupDatabase() {
	m, err := migration.InitMigration(os.Getenv("DATABASE_URL"))
	if err != nil {
		panic(err)
	}
	if err := m.Down(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		panic(err)
	}
	m.Close()
}

func setupApp() {
	app = fiber.New(fiber.Config{
		StrictRouting: true,
		CaseSensitive: true,
	})

	// route
	credential := types.Credential{UserID: 1, ExpiresAt: time.Now().Add(time.Hour).Unix()}
	api := app.Group("/api/v1", mock.Set(credential))
	api.Get("/user", handler.UserInfo)
	api.Get("/feeds", handler.FeedList)
	api.Put("/feeds/add", validate.ContentType("application/json"), handler.FeedAdd)
	api.Delete("/feeds/remove", validate.ContentType("application/json"), handler.FeedRemove)
	api.Get("/feeds/export", handler.FeedExport)
	api.Post("/feeds/import", validate.ContentType("multipart/form-data"), handler.FeedImport)

	app.Get("/api/logout", handler.Logout)
	app.Get(
		"/api/connect/github",
		mock.Set(&github.Profile{ID: 1, Email: "feedbox@example.com"}),
		handler.ConnectGithub)
}

func TestCreateUser(t *testing.T) {
	req := httptest.NewRequest("GET", "http://127.0.0.1:8000/api/connect/github", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	cupaloy.SnapshotT(t, resp.Status)
}

func TestLogout(t *testing.T) {
	req := httptest.NewRequest("GET", "http://127.0.0.1:8000/api/logout", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	cupaloy.SnapshotT(t, resp.Header.Get("Set-Cookie"))
}

func TestUser(t *testing.T) {
	req := httptest.NewRequest("GET", "http://127.0.0.1:8000/api/v1/user", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, string(body))
}

func TestAddFeed(t *testing.T) {
	payload := strings.NewReader(`{"url":"http://127.0.0.1"}`)
	req := httptest.NewRequest("PUT", "http://127.0.0.1:8000/api/v1/feeds/add", payload)
	req.Header.Set("content-type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, string(body))
}

func TestListFeed(t *testing.T) {
	req := httptest.NewRequest("GET", "http://127.0.0.1:8000/api/v1/feeds", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, string(body))
}

func TestExportFeed(t *testing.T) {
	req := httptest.NewRequest("GET", "http://127.0.0.1:8000/api/v1/feeds/export", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, string(body))
}

func TestImportFeed(t *testing.T) {
	opml := strings.NewReader(`
	<?xml version="1.0" encoding="utf-8"?>
	<opml version="1.0">
	<head><title>feeds</title></head>
	<body>
	<outline type="rss" text="blog.cloudflare.com" xmlUrl="https://blog.cloudflare.com/rss/"/>
	<outline type="rss" text="v8.dev" xmlUrl="https://v8.dev/blog.atom"/>
	<outline type="rss" text="webkit.org" xmlUrl="https://webkit.org/feed/atom/"/>
	</body>
	</opml>`)
	var payload bytes.Buffer
	m := multipart.New(&payload).
		File("opml", "feed.opml", opml)
	if err := m.Close(); err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest("POST", "http://127.0.0.1:8000/api/v1/feeds/import", &payload)
	req.Header.Set("content-type", m.ContentType)

	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, string(body))
}

func TestRemoveFeed(t *testing.T) {
	payload := strings.NewReader(`{"feedID":1}`)
	req := httptest.NewRequest("DELETE", "http://127.0.0.1:8000/api/v1/feeds/remove", payload)
	req.Header.Set("content-type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, string(body))
}
