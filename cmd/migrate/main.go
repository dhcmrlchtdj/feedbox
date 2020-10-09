package main

import (
	"errors"
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
		if err == nil {
			fmt.Printf("version: %v\ndirty:   %v\n", version, dirty)
		} else if errors.Is(err, migrate.ErrNilVersion) {
			fmt.Print("version: nil\ndirty:   false\n")
		} else {
			panic(err)
		}
	}
	printUsage := func() {
		println("Usage: ./migrate [up | down | force VERSION | step N]")
		printVersion()
	}
	checkErr := func(err error) {
		if err == nil {
			fmt.Println("done.")
		} else if errors.Is(err, migrate.ErrNoChange) {
			fmt.Println("no change.")
		} else {
			panic(err)
		}
		printVersion()
	}

	flag.Parse()
	switch flag.Arg(0) {
	case "u", "up":
		checkErr(m.Up())
	case "d", "down":
		checkErr(m.Down())
	case "f", "force":
		if version, err := strconv.Atoi(flag.Arg(1)); err == nil {
			checkErr(m.Force(version))
		} else {
			printUsage()
		}
	case "s", "step":
		if n, err := strconv.Atoi(flag.Arg(1)); err == nil {
			checkErr(m.Steps(n))
		} else {
			printUsage()
		}
	default:
		printUsage()
	}
}
