package sqlite

import (
	"context"
	"database/sql"
	"strings"
	"time"

	"github.com/pkg/errors"
	"github.com/rs/zerolog"
	_ "modernc.org/sqlite"

	"github.com/dhcmrlchtdj/feedbox/internal/util"
)

type Database struct {
	db *sql.DB
}

func New(ctx context.Context, uri string) (*Database, error) {
	if !strings.HasPrefix(uri, "sqlite://") {
		return nil, errors.Errorf("invalid DATABASE_URL: %s", uri)
	}
	dbURI := uri[9:]
	db, err := sql.Open("sqlite", dbURI)
	if err != nil {
		return nil, err
	}

	zerolog.Ctx(ctx).
		Debug().
		Str("module", "database").
		Str("uri", uri).
		Msg("connecting to database")

	_, err = db.Exec(`
		PRAGMA journal_mode = WAL;
		PRAGMA synchronous = NORMAL;
		PRAGMA temp_store = memory;
		PRAGMA busy_timeout = 5000;
	`)
	if err != nil {
		return nil, err
	}

	return &Database{db}, nil
}

func (db *Database) Close() {
	err := db.db.Close()
	if err != nil {
		panic(err)
	}
}

func (db *Database) Exec(ctx context.Context, query string, args ...any) (sql.Result, error) {
	start := time.Now()
	defer func() {
		latency := time.Since(start)
		zerolog.Ctx(ctx).
			Trace().
			Str("module", "database").
			Str("query", query).
			Str("args", util.Jsonify(args...)).
			Dur("latency", latency).
			Msg("exec")
	}()
	return db.db.ExecContext(ctx, query, args...)
}

func (db *Database) Query(ctx context.Context, query string, args ...any) (*sql.Rows, error) {
	start := time.Now()
	defer func() {
		latency := time.Since(start)
		zerolog.Ctx(ctx).
			Trace().
			Str("module", "database").
			Str("query", query).
			Str("args", util.Jsonify(args...)).
			Dur("latency", latency).
			Msg("exec")
	}()
	return db.db.QueryContext(ctx, query, args...)
}

func (db *Database) QueryRow(ctx context.Context, query string, args ...any) *sql.Row {
	start := time.Now()
	defer func() {
		latency := time.Since(start)
		zerolog.Ctx(ctx).
			Trace().
			Str("module", "database").
			Str("query", query).
			Str("args", util.Jsonify(args...)).
			Dur("latency", latency).
			Msg("exec")
	}()
	return db.db.QueryRowContext(ctx, query, args...)
}
