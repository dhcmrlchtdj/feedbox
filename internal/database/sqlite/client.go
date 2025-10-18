package sqlite

import (
	"context"
	"database/sql"
	"encoding/json"
	"strings"
	"time"

	_ "github.com/ncruces/go-sqlite3/driver"
	_ "github.com/ncruces/go-sqlite3/embed"
	"github.com/pkg/errors"
	"github.com/rs/xid"
	"github.com/rs/zerolog"
)

type Database struct {
	db *sql.DB
}

func New(ctx context.Context, uri string) (*Database, error) {
	if !strings.HasPrefix(uri, "sqlite://") {
		return nil, errors.WithMessage(errors.New("invalid DATABASE_URL"), uri)
	}
	dbURI := uri[9:]
	db, err := sql.Open("sqlite3", dbURI)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	zerolog.Ctx(ctx).
		Info().
		Str("module", "database").
		Str("uri", uri).
		Msg("connecting to database")

	_, err = db.ExecContext(ctx, `
		PRAGMA journal_mode = WAL;
		PRAGMA synchronous = NORMAL;
		PRAGMA temp_store = MEMORY;
		PRAGMA busy_timeout = 10000;
	`)
	if err != nil {
		return nil, errors.WithStack(err)
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
			Info().
			Str("module", "database").
			Str("dbrid", xid.New().String()).
			Str("query", query).
			Str("args", jsonify(args...)).
			Dur("latency", latency).
			Msg("Exec")
	}()
	r, err := db.db.ExecContext(ctx, query, args...)
	return r, errors.WithStack(err)
}

func (db *Database) Query(ctx context.Context, query string, args ...any) (*sql.Rows, error) {
	start := time.Now()
	defer func() {
		latency := time.Since(start)
		zerolog.Ctx(ctx).
			Info().
			Str("module", "database").
			Str("dbrid", xid.New().String()).
			Str("query", query).
			Str("args", jsonify(args...)).
			Dur("latency", latency).
			Msg("Query")
	}()
	r, err := db.db.QueryContext(ctx, query, args...) // nolint: sqlclosecheck
	return r, errors.WithStack(err)
}

func (db *Database) QueryRow(ctx context.Context, query string, args ...any) *sql.Row {
	start := time.Now()
	defer func() {
		latency := time.Since(start)
		zerolog.Ctx(ctx).
			Info().
			Str("module", "database").
			Str("dbrid", xid.New().String()).
			Str("query", query).
			Str("args", jsonify(args...)).
			Dur("latency", latency).
			Msg("QueryRow")
	}()
	return db.db.QueryRowContext(ctx, query, args...)
}

func jsonify(args ...any) string {
	b, err := json.Marshal(args)
	if err != nil {
		return err.Error()
	}
	return string(b)
}
