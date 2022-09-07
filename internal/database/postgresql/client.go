package postgresql

import (
	"context"
	"time"

	"github.com/dhcmrlchtdj/feedbox/internal/util"
	"github.com/jackc/pgconn"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/rs/zerolog"
)

type Database struct {
	pool   *pgxpool.Pool
	logger *zerolog.Logger
}

func New(uri string, logger *zerolog.Logger) (*Database, error) {
	config, err := pgxpool.ParseConfig(uri)
	if err != nil {
		return nil, err
	}

	if logger != nil {
		customizedLogger := logger.With().Str("module", "database").Logger()
		logger = &customizedLogger

		logger.Debug().
			Str("uri", uri).
			Msg("connecting to database")
	}

	pool, err := pgxpool.ConnectConfig(context.Background(), config)
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