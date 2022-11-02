package sqlite

import (
	"database/sql"
	"strings"
	"time"

	"github.com/dhcmrlchtdj/feedbox/internal/util"
	"github.com/pkg/errors"
	"github.com/rs/zerolog"
	_ "modernc.org/sqlite"
)

type Database struct {
	db     *sql.DB
	logger *zerolog.Logger
}

func New(uri string, logger *zerolog.Logger) (*Database, error) {
	if !strings.HasPrefix(uri, "sqlite://") {
		return nil, errors.Errorf("invalid DATABASE_URL: %s", uri)
	}
	dbUri := uri[9:]
	db, err := sql.Open("sqlite", dbUri)
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

	_, err = db.Exec(`
		PRAGMA journal_mode = WAL;
		PRAGMA synchronous = NORMAL;
		PRAGMA temp_store = memory;
		PRAGMA busy_timeout = 5000;
	`)
	if err != nil {
		return nil, err
	}

	return &Database{db, logger}, nil
}

func (db *Database) Close() {
	err := db.db.Close()
	if err != nil {
		panic(err)
	}
}

func (db *Database) Exec(query string, args ...any) (sql.Result, error) {
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
	return db.db.Exec(query, args...)
}

func (db *Database) Query(query string, args ...any) (*sql.Rows, error) {
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
	return db.db.Query(query, args...)
}

func (db *Database) QueryRow(query string, args ...any) *sql.Row {
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
	return db.db.QueryRow(query, args...)
}
