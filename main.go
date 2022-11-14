package main

import (
	"flag"
	"fmt"
	"os"
	"os/signal"
	"strconv"
	"sync"
	"syscall"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/joho/godotenv"
	"github.com/pkg/errors"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/rs/zerolog/pkgerrors"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/email"
	"github.com/dhcmrlchtdj/feedbox/internal/global"
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
	case "serverAndWorker":
		startServerAndWorker()
	case "server":
		startServer()
	case "worker":
		startWorker()
	case "migrate":
		startMigration()
	default:
		fmt.Println("Usage: ./app [serverAndWorker | server | worker | migrate]")
	}
}

///

func startServerAndWorker() {
	initEnv()
	initLogger()
	initDatabase()
	defer global.Database.Close()
	initEmail()
	initTelegram()
	initSign()

	quit := quitSignal()

	var wg sync.WaitGroup

	wg.Add(1)
	go func() {
		defer wg.Done()
		runWorker(quit)
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		runServer(quit)
	}()

	wg.Wait()

	log.Info().Str("module", "app").Msg("app stopped")
}

func startServer() {
	initEnv()
	initLogger()
	initDatabase()
	defer global.Database.Close()
	initEmail()
	initTelegram()
	initSign()

	quit := quitSignal()
	runServer(quit)
	log.Info().Str("module", "app").Msg("app stopped")
}

func startWorker() {
	initEnv()
	initLogger()
	initDatabase()
	initEmail()
	initTelegram()

	worker.Start()
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

///

func runServer(quit <-chan struct{}) {
	util.CheckEnvs("GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET")
	util.CheckEnvs("HOST", "PORT", "TELEGRAM_WEBHOOK_PATH", "WORKER_TOKEN")

	app := server.Create()
	go func() {
		<-quit
		err := app.Shutdown()
		if err != nil {
			panic(err)
		}
	}()

	host := os.Getenv("HOST") + ":" + os.Getenv("PORT")
	url := "http://" + host + os.Getenv("SERVER_SUB_DIR")
	log.Info().Str("module", "app").Str("url", url).Msg("app started")
	err := app.Listen(host)
	if err != nil {
		panic(err)
	}
}

func runWorker(quit <-chan struct{}) {
	ticker := time.NewTicker(time.Minute * 10)
	for {
		select {
		case t := <-ticker.C:
			if t.Minute() >= 50 {
				worker.Start()
			}
		case <-quit:
			ticker.Stop()
			return
		}
	}
}

///

func initEnv() {
	if os.Getenv("ENV") != "prod" {
		if err := godotenv.Load("./dotenv"); err != nil {
			panic(err)
		}
	}
	util.CheckEnvs("ENV")
}

func initLogger() {
	zerolog.ErrorStackMarshaler = pkgerrors.MarshalStack // nolint:reassign
}

func initDatabase() {
	util.CheckEnvs("DATABASE_URL")
	db, err := database.New(os.Getenv("DATABASE_URL"), &log.Logger)
	if err != nil {
		panic(err)
	}
	global.Database = db
}

func initEmail() {
	if os.Getenv("ENV") == "prod" {
		util.CheckEnvs("MAILGUN_DOMAIN", "MAILGUN_API_KEY", "MAILGUN_FROM")
		global.Email = email.NewMailgun(
			os.Getenv("MAILGUN_DOMAIN"),
			os.Getenv("MAILGUN_API_KEY"),
			os.Getenv("MAILGUN_FROM"),
		)
	} else {
		global.Email = email.NewDryRun()
	}
}

func initTelegram() {
	if os.Getenv("ENV") == "prod" {
		util.CheckEnvs("SERVER")
		util.CheckEnvs("TELEGRAM_BOT_NAME", "TELEGRAM_BOT_TOKEN")
		global.Telegram = telegram.NewHTTPClient(
			os.Getenv("TELEGRAM_BOT_NAME"),
			os.Getenv("TELEGRAM_BOT_TOKEN"),
		)
	} else {
		global.Telegram = telegram.NewDryRun()
	}
}

func initSign() {
	util.CheckEnvs("COOKIE_SECRET")
	s, err := sign.New(os.Getenv("COOKIE_SECRET"))
	if err != nil {
		panic(err)
	}
	global.Sign = s
}

///

func quitSignal() <-chan struct{} {
	quit := make(chan struct{})
	go func() {
		c := make(chan os.Signal, 1)
		signal.Notify(c, syscall.SIGINT, syscall.SIGTERM)
		sig := <-c
		log.Info().Str("module", "app").Str("signal", sig.String()).Msg("app stopping")
		close(quit)
	}()
	return quit
}
