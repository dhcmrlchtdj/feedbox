package main

import (
	"flag"
	"fmt"
	"os"
	"strconv"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"

	"github.com/dhcmrlchtdj/feedbox/internal/util"
)

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

	printVersion := func() {
		version, dirty, err := m.Version()
		if err != nil {
			panic(err)
		}
		fmt.Printf("version: %v\ndirty:   %v\n", version, dirty)
	}
	printUsage := func() {
		println("Usage: ./migrate [up | down | force VERSION | step N]")
		printVersion()
	}
	checkErr := func(err error) {
		if err != nil {
			if err == migrate.ErrNoChange {
				fmt.Println("no change.")
			} else {
				panic(err)
			}
		}
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
		checkErr(m.Up())
	case "d", "down":
		checkErr(m.Down())
	case "f", "force":
		if len(args) != 2 {
			printUsage()
			return
		}
		if version, err := strconv.Atoi(args[1]); err == nil {
			checkErr(m.Force(version))
		} else {
			printUsage()
		}
	case "s", "step":
		if len(args) != 2 {
			printUsage()
			return
		}
		if n, err := strconv.Atoi(args[1]); err == nil {
			checkErr(m.Steps(n))
		} else {
			printUsage()
		}
	default:
		printUsage()
	}
}
