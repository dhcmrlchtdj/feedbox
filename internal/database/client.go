package database

import (
	"context"

	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

type Database struct {
	pool *pgxpool.Pool
}

type dbOption func(*pgxpool.Config)

func New(configURL string, opts ...dbOption) (*Database, error) {
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
	return &Database{pool}, nil
}

func WithMaxConns(maxConns int32) dbOption {
	return func(config *pgxpool.Config) {
		config.MaxConns = maxConns
	}
}

func WithLogger(logger pgx.Logger) dbOption {
	return func(config *pgxpool.Config) {
		config.ConnConfig.LogLevel = pgx.LogLevelInfo
		config.ConnConfig.Logger = logger
	}
}

func (db *Database) Close() {
	db.pool.Close()
}
