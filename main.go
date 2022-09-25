package main

import (
	"errors"
	"flag"
	"fmt"
	"os"
	"strconv"

	"github.com/golang-migrate/migrate/v4"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/email"
	"github.com/dhcmrlchtdj/feedbox/internal/sign"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
	"github.com/dhcmrlchtdj/feedbox/internal/util"
	"github.com/dhcmrlchtdj/feedbox/migration"
	"github.com/dhcmrlchtdj/feedbox/server"
	"github.com/dhcmrlchtdj/feedbox/worker"
)

func main() {
	flag.Parse()
	switch flag.Arg(0) {
	case "server":
		startServer()
	case "worker":
		startWorker()
	case "migrate":
		startMigration()
	default:
		fmt.Println("Usage: ./app [server | worker | migrate]")
	}
}

func startServer() {
	initEnv()
	initLogger()
	initDatabase()
	defer database.C.Close()
	initMailgun()
	initTelegram()
	initSign()

	util.CheckEnvs("GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET")
	util.CheckEnvs("HOST", "PORT", "TELEGRAM_WEBHOOK_PATH", "WORKER_TOKEN")
	app := server.Create()
	host := os.Getenv("HOST") + ":" + os.Getenv("PORT")
	url := "http://" + host + os.Getenv("SERVER_SUB_DIR")
	log.Info().Str("module", "app").Str("url", url).Msg("app started")
	if err := app.Listen(host); err != nil {
		panic(err)
	}
}

func startWorker() {
	initEnv()
	initLogger()
	initDatabase()
	defer database.C.Close()
	initTelegram()

	worker.Start()
}

func initEnv() {
	if os.Getenv("ENV") != "prod" {
		if err := godotenv.Load("./dotenv"); err != nil {
			panic(err)
		}
	}
	util.CheckEnvs("ENV")
}

func initLogger() {
	if os.Getenv("ENV") != "prod" {
		log.Logger = log.Output(util.JSONConsoleWriter{Out: os.Stderr})
	}
}

func initDatabase() {
	util.CheckEnvs("DATABASE_URL")
	db, err := database.New(os.Getenv("DATABASE_URL"), &log.Logger)
	if err != nil {
		panic(err)
	}
	database.C = db
}

func initMailgun() {
	if os.Getenv("ENV") == "prod" {
		util.CheckEnvs("MAILGUN_DOMAIN", "MAILGUN_API_KEY", "MAILGUN_FROM")
		email.C = email.NewMailgun(
			os.Getenv("MAILGUN_DOMAIN"),
			os.Getenv("MAILGUN_API_KEY"),
			os.Getenv("MAILGUN_FROM"),
		)
	} else {
		email.C = email.NewDryRun()
	}
}

func initTelegram() {
	if os.Getenv("ENV") == "prod" {
		util.CheckEnvs("SERVER")
		util.CheckEnvs("TELEGRAM_BOT_NAME", "TELEGRAM_BOT_TOKEN")
		telegram.C = telegram.NewHttpClient(
			os.Getenv("TELEGRAM_BOT_NAME"),
			os.Getenv("TELEGRAM_BOT_TOKEN"),
		)
	} else {
		telegram.C = telegram.NewDryRun()
	}
}

func initSign() {
	util.CheckEnvs("COOKIE_PASSWORD")
	s, err := sign.New(os.Getenv("COOKIE_PASSWORD"))
	if err != nil {
		panic(err)
	}
	sign.S = s
}

func startMigration() {
	printVersion := func(m *migrate.Migrate) {
		version, dirty, err := m.Version()
		if err == nil {
			log.Info().Uint("version", version).Bool("dirty", dirty).Send()
		} else if errors.Is(err, migrate.ErrNilVersion) {
			log.Info().Str("version", "nil").Bool("dirty", false).Send()
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
			log.Info().Msg("done")
		} else if errors.Is(err, migrate.ErrNoChange) {
			log.Info().Msg("no change")
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
