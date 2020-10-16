package database

import (
	"context"
	"sync"

	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/log/zerologadapter"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/rs/zerolog"
)

type Database struct {
	pool  *pgxpool.Pool
	cache *sync.Map
}

func New(configURL string, opts ...func(*pgxpool.Config)) (*Database, error) {
	config, err := pgxpool.ParseConfig(configURL)
	if err != nil {
		return nil, err
	}

	for _, opt := range opts {
		opt(config)
	}

	pool, err := pgxpool.ConnectConfig(context.Background(), config)
	if err != nil {
		return nil, err
	}
	return &Database{pool, new(sync.Map)}, nil
}

func WithMaxConns(maxConns int32) func(*pgxpool.Config) {
	return func(config *pgxpool.Config) {
		config.MaxConns = maxConns
	}
}

func WithLogger(level string, logger zerolog.Logger) func(*pgxpool.Config) {
	return func(config *pgxpool.Config) {
		level, err := pgx.LogLevelFromString(level)
		if err != nil {
			panic(err)
		}
		config.ConnConfig.LogLevel = level
		config.ConnConfig.Logger = zerologadapter.NewLogger(logger)
	}
}

func (db *Database) Close() {
	db.pool.Close()
}
