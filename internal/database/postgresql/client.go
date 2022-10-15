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
	pool   *pgxpool.Pool
	logger *zerolog.Logger
}

func New(uri string, logger *zerolog.Logger) (*Database, error) {
	if logger != nil {
		customizedLogger := logger.With().Str("module", "database").Logger()
		logger = &customizedLogger

		logger.Debug().
			Str("uri", uri).
			Msg("connecting to database")
	}

	pool, err := pgxpool.New(context.Background(), uri)
	if err != nil {
		return nil, err
	}

	return &Database{pool, logger}, nil
}

func (db *Database) Close() {
	db.pool.Close()
}

func (db *Database) Exec(query string, args ...any) (pgconn.CommandTag, error) {
	if db.logger != nil {
		start := time.Now()
		defer func() {
			latency := time.Since(start)
			db.logger.Trace().
				Str("query", query).
				Str("args", util.Jsonify(args...)).
				Dur("latency", latency).
				Msg("exec")
		}()
	}
	return db.pool.Exec(context.Background(), query, args...)
}

func (db *Database) Query(query string, args ...any) (pgx.Rows, error) {
	if db.logger != nil {
		start := time.Now()
		defer func() {
			latency := time.Since(start)
			db.logger.Trace().
				Str("query", query).
				Str("args", util.Jsonify(args...)).
				Dur("latency", latency).
				Msg("exec")
		}()
	}
	return db.pool.Query(context.Background(), query, args...)
}

func (db *Database) QueryRow(query string, args ...any) pgx.Row {
	if db.logger != nil {
		start := time.Now()
		defer func() {
			latency := time.Since(start)
			db.logger.Trace().
				Str("query", query).
				Str("args", util.Jsonify(args...)).
				Dur("latency", latency).
				Msg("exec")
		}()
	}
	return db.pool.QueryRow(context.Background(), query, args...)
}
