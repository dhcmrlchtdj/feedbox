package postgresql

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"

	"github.com/dhcmrlchtdj/feedbox/internal/util"
)

type Database struct {
	pool *pgxpool.Pool
}

func New(ctx context.Context, uri string) (*Database, error) {
	zerolog.Ctx(ctx).
		Debug().
		Str("module", "database").
		Str("uri", uri).
		Msg("connecting to database")

	pool, err := pgxpool.New(ctx, uri)
	if err != nil {
		return nil, err
	}

	return &Database{pool}, nil
}

func (db *Database) Close() {
	db.pool.Close()
}

func (db *Database) Exec(ctx context.Context, query string, args ...any) (pgconn.CommandTag, error) {
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
	return db.pool.Exec(ctx, query, args...)
}

func (db *Database) Query(ctx context.Context, query string, args ...any) (pgx.Rows, error) {
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
	return db.pool.Query(ctx, query, args...)
}

func (db *Database) QueryRow(ctx context.Context, query string, args ...any) pgx.Row {
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
	return db.pool.QueryRow(ctx, query, args...)
}
