package database

import (
	"database/sql"
	"encoding/json"
	"time"

	"github.com/rs/zerolog"
	_ "modernc.org/sqlite"
)

var C *Database

type Database struct {
	db     *sql.DB
	logger *zerolog.Logger
}

func New(uri string, logger *zerolog.Logger) (*Database, error) {
	db, err := sql.Open("sqlite", uri)
	if err != nil {
		return nil, err
	}

	if logger != nil {
		customizedLogger := logger.With().Str("module", "database").Logger()
		logger = &customizedLogger

		logger.Debug().
			Str("uri", uri).
			Msg("connected to database")
	}

	_, err = db.Exec(
		`PRAGMA journal_mode = WAL;
		PRAGMA synchronous = NORMAL;
		`)
	if err != nil {
		panic(err)
	}

	return &Database{db, logger}, nil
}

func (db *Database) Exec(query string, args ...any) (sql.Result, error) {
	if db.logger != nil {
		start := time.Now()
		defer func() {
			latency := time.Since(start)
			db.logger.Trace().
				Str("query", query).
				Str("args", jsonify(args...)).
				Dur("latency", latency).
				Msg("exec")
		}()
	}
	return db.db.Exec(query, args...)
}

func (db *Database) Query(query string, args ...any) (*sql.Rows, error) {
	if db.logger != nil {
		start := time.Now()
		defer func() {
			latency := time.Since(start)
			db.logger.Trace().
				Str("query", query).
				Str("args", jsonify(args...)).
				Dur("latency", latency).
				Msg("exec")
		}()
	}
	return db.db.Query(query, args...)
}

func (db *Database) QueryRow(query string, args ...any) *sql.Row {
	if db.logger != nil {
		start := time.Now()
		defer func() {
			latency := time.Since(start)
			db.logger.Trace().
				Str("query", query).
				Str("args", jsonify(args...)).
				Dur("latency", latency).
				Msg("exec")
		}()
	}
	return db.db.QueryRow(query, args...)
}

func (db *Database) Close() {
	err := db.db.Close()
	if err != nil {
		panic(err)
	}
}

func jsonify(args ...any) string {
	b, err := json.Marshal(args)
	if err != nil {
		return err.Error()
	}
	return string(b)
}
