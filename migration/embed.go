package migration

import (
	"embed"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed *.sql
var fs embed.FS

func InitMigration(dbUrl string) (*migrate.Migrate, error) {
	migrationDir, err := iofs.New(fs, ".")
	if err != nil {
		return nil, err
	}
	m, err := migrate.NewWithSourceInstance("iofs", migrationDir, dbUrl)
	if err != nil {
		return nil, err
	}
	return m, nil
}
