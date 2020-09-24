package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"

	"github.com/dhcmrlchtdj/feedbox/util"
)

func main() {
	if os.Getenv("ENV") != "prod" {
		if err := godotenv.Load("./dotenv"); err != nil {
			log.Fatal(err)
		}
	}
	if err := util.CheckEnvs("DATABASE_URL"); err != nil {
		log.Fatal(err)
	}

	m, err := migrate.New("file://database/migrations", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer m.Close()

	printVersion := func() {
		version, dirty, err := m.Version()
		if err != nil {
			log.Fatal(err)
		}
		fmt.Printf("version: %v\ndirty:   %v\n", version, dirty)
	}
	printUsage := func() {
		println("Usage: ./migrate [up | down | force VERSION | step N]")
		printVersion()
	}

	flag.Parse()
	args := flag.Args()
	if len(args) == 0 {
		printUsage()
		return
	}

	switch args[0] {
	case "u", "up":
		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			log.Fatal(err)
		}
		printVersion()
	case "d", "down":
		if err := m.Down(); err != nil && err != migrate.ErrNoChange {
			log.Fatal(err)
		}
		printVersion()
	case "f", "force":
		if len(args) != 2 {
			printUsage()
			return
		}
		if version, err := strconv.Atoi(args[1]); err == nil {
			if err := m.Force(version); err != nil && err != migrate.ErrNoChange {
				log.Fatal(err)
			}
			printVersion()
		} else {
			printUsage()
		}
	case "s", "step":
		if len(args) != 2 {
			printUsage()
			return
		}
		if n, err := strconv.Atoi(args[1]); err == nil {
			if err := m.Steps(n); err != nil && err != migrate.ErrNoChange {
				log.Fatal(err)
			}
			printVersion()
		} else {
			printUsage()
		}
	default:
		printUsage()
	}
}
