package migration

import (
	"embed"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite"
	"github.com/golang-migrate/migrate/v4/source"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/pkg/errors"
)

//go:embed postgresql/*.sql sqlite/*.sql
var fs embed.FS

func InitMigration(uri string) (*migrate.Migrate, error) {
	var migrationDir source.Driver
	var err error
	if strings.HasPrefix(uri, "postgres://") {
		migrationDir, err = iofs.New(fs, "postgresql")
	} else if strings.HasPrefix(uri, "sqlite://") {
		migrationDir, err = iofs.New(fs, "sqlite")
	} else {
		return nil, errors.New("unknown database url")
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
