package main

import (
	"flag"
	"fmt"
	"os"
	"strconv"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"
	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/util"
)

func printVersion(m *migrate.Migrate) {
	version, dirty, err := m.Version()
	if err == nil {
		fmt.Printf("version: %v\ndirty:   %v\n", version, dirty)
	} else if errors.Is(err, migrate.ErrNilVersion) {
		fmt.Print("version: nil\ndirty:   false\n")
	} else {
		panic(err)
	}
}

func printUsage(m *migrate.Migrate) {
	fmt.Println("Usage: ./migrate [up | down | force VERSION | step N]")
	printVersion(m)
}

func checkErr(err error, m *migrate.Migrate) {
	if err == nil {
		fmt.Println("done.")
	} else if errors.Is(err, migrate.ErrNoChange) {
		fmt.Println("no change.")
	} else {
		panic(err)
	}
	printVersion(m)
}

func main() {
	if os.Getenv("ENV") != "prod" {
		if err := godotenv.Load("./dotenv"); err != nil {
			panic(err)
		}
	}

	util.CheckEnvs("DATABASE_URL")
	m, err := migrate.New("file://./migration", os.Getenv("DATABASE_URL"))
	if err != nil {
		panic(err)
	}
	defer m.Close()

	flag.Parse()
	switch flag.Arg(0) {
	case "u", "up":
		checkErr(m.Up(), m)
	case "d", "down":
		checkErr(m.Down(), m)
	case "f", "force":
		if version, err := strconv.Atoi(flag.Arg(1)); err == nil {
			checkErr(m.Force(version), m)
		} else {
			printUsage(m)
		}
	case "s", "step":
		if n, err := strconv.Atoi(flag.Arg(1)); err == nil {
			checkErr(m.Steps(n), m)
		} else {
			printUsage(m)
		}
	default:
		printUsage(m)
	}
}
