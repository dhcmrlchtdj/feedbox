package sqlite

import (
	"context"
	"database/sql"
	"encoding/json"
	"strings"
	"time"

	"github.com/morikuni/failure"
	"github.com/rs/xid"
	"github.com/rs/zerolog"
	_ "modernc.org/sqlite"
)

type Database struct {
	db *sql.DB
}

func New(ctx context.Context, uri string) (*Database, error) {
	if !strings.HasPrefix(uri, "sqlite://") {
		return nil, failure.Unexpected("invalid DATABASE_URL", failure.Message(uri))
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
		PRAGMA temp_store = MEMORY;
		PRAGMA busy_timeout = 10000;
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
	logger := zerolog.Ctx(ctx).With().
		Str("module", "database").
		Str("dbrid", xid.New().String()).
		Logger()
	logger.Trace().
		Str("query", query).
		Str("args", jsonify(args...)).
		Msg("Exec")
	start := time.Now()
	defer func() {
		latency := time.Since(start)
		logger.Trace().Dur("latency", latency).Send()
	}()

	return db.db.ExecContext(ctx, query, args...)
}

func (db *Database) Query(ctx context.Context, query string, args ...any) (*sql.Rows, error) {
	logger := zerolog.Ctx(ctx).With().
		Str("module", "database").
		Str("dbrid", xid.New().String()).
		Logger()
	logger.Trace().
		Str("query", query).
		Str("args", jsonify(args...)).
		Msg("Query")
	start := time.Now()
	defer func() {
		latency := time.Since(start)
		logger.Trace().Dur("latency", latency).Send()
	}()
	return db.db.QueryContext(ctx, query, args...)
}

func (db *Database) QueryRow(ctx context.Context, query string, args ...any) *sql.Row {
	logger := zerolog.Ctx(ctx).With().
		Str("module", "database").
		Str("dbrid", xid.New().String()).
		Logger()
	logger.Trace().
		Str("query", query).
		Str("args", jsonify(args...)).
		Msg("QueryRow")
	start := time.Now()
	defer func() {
		latency := time.Since(start)
		logger.Trace().Dur("latency", latency).Send()
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
