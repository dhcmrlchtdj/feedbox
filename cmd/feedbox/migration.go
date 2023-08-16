package main

import (
	"errors"
	"flag"
	"fmt"
	"os"
	"strconv"

	"github.com/golang-migrate/migrate/v4"
	"github.com/rs/zerolog"

	"github.com/dhcmrlchtdj/feedbox/internal/util"
	"github.com/dhcmrlchtdj/feedbox/migration"
)

func startMigration() {
	logger := zerolog.New(os.Stderr).With().Timestamp().Logger()
	// ctx := logger.WithContext(context.Background())

	printVersion := func(m *migrate.Migrate) {
		version, dirty, err := m.Version()
		if err == nil {
			logger.Info().Uint("version", version).Bool("dirty", dirty).Send()
		} else if errors.Is(err, migrate.ErrNilVersion) {
			logger.Info().Str("version", "nil").Bool("dirty", false).Send()
		} else {
			panic(err)
		}
	}

	printUsage := func(m *migrate.Migrate) {
		fmt.Println("Usage: ./app migrate [up | down | force VERSION | step N]")
		printVersion(m)
	}

	checkErr := func(err error, m *migrate.Migrate) {
		if err == nil {
			logger.Info().Msg("done")
		} else if errors.Is(err, migrate.ErrNoChange) {
			logger.Info().Msg("no change")
		} else {
			panic(err)
		}
		printVersion(m)
	}

	initEnv()

	util.CheckEnvs("DATABASE_URL")
	m, err := migration.InitMigration(os.Getenv("DATABASE_URL"))
	if err != nil {
		panic(err)
	}
	defer m.Close()

	switch flag.Arg(1) {
	case "u", "up":
		checkErr(m.Up(), m)
	case "d", "down":
		checkErr(m.Down(), m)
	case "f", "force":
		if version, err := strconv.Atoi(flag.Arg(2)); err == nil {
			checkErr(m.Force(version), m)
		} else {
			printUsage(m)
		}
	case "s", "step":
		if n, err := strconv.Atoi(flag.Arg(2)); err == nil {
			checkErr(m.Steps(n), m)
		} else {
			printUsage(m)
		}
	default:
		printUsage(m)
	}
}
