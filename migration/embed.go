package migration

import (
	"embed"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite"
	"github.com/golang-migrate/migrate/v4/source"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/morikuni/failure"
)

//go:embed sqlite/*.sql
var fs embed.FS

func InitMigration(uri string) (*migrate.Migrate, error) {
	var migrationDir source.Driver
	var err error
	if strings.HasPrefix(uri, "sqlite://") {
		migrationDir, err = iofs.New(fs, "sqlite")
	} else {
		return nil, failure.Unexpected("unknown database url")
	}
	if err != nil {
		return nil, err
	}

	m, err := migrate.NewWithSourceInstance("iofs", migrationDir, uri)
	if err != nil {
		return nil, err
	}

	return m, nil
}
