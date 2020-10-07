package database

import (
	"context"

	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

type Database struct {
	pool *pgxpool.Pool
}

type DbOption func(*pgxpool.Config)

func New(configURL string, opts ...DbOption) (*Database, error) {
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

func WithMaxConns(maxConns int32) DbOption {
	return func(config *pgxpool.Config) {
		config.MaxConns = maxConns
	}
}

func WithLogger(level pgx.LogLevel, logger pgx.Logger) DbOption {
	return func(config *pgxpool.Config) {
		config.ConnConfig.LogLevel = level
		config.ConnConfig.Logger = logger
	}
}

func (db *Database) Close() {
	db.pool.Close()
}
