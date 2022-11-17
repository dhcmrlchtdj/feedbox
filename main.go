package main

import (
	"context"
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
	logger := zerolog.New(os.Stderr).With().Timestamp().Logger()
	ctx, cancel := context.WithCancel(context.Background())
	ctx = logger.WithContext(ctx)

	// zerolog.Ctx(ctx)
	initEnv()
	initLogger()
	initDatabase(ctx)
	defer global.Database.Close()
	initEmail()
	initTelegram()
	initSign()
	go initQuitSignal(ctx, cancel)

	var wg sync.WaitGroup

	wg.Add(1)
	go func() {
		defer wg.Done()
		runWorker(ctx)
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		runServer(ctx)
	}()

	wg.Wait()

	logger.Info().Str("module", "app").Msg("app stopped")
}

func startServer() {
	logger := zerolog.New(os.Stderr).With().Timestamp().Logger()
	ctx, cancel := context.WithCancel(context.Background())
	ctx = logger.WithContext(ctx)

	initEnv()
	initLogger()
	initDatabase(ctx)
	defer global.Database.Close()
	initEmail()
	initTelegram()
	initSign()
	go initQuitSignal(ctx, cancel)

	runServer(ctx)
	logger.Info().Str("module", "app").Msg("app stopped")
}

func startWorker() {
	logger := zerolog.New(os.Stderr).With().Timestamp().Logger()
	ctx := logger.WithContext(context.Background())

	initEnv()
	initLogger()
	initDatabase(ctx)
	initEmail()
	initTelegram()

	worker.Start(ctx)
}

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

///

func runServer(ctx context.Context) {
	util.CheckEnvs("GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET")
	util.CheckEnvs("HOST", "PORT", "TELEGRAM_WEBHOOK_PATH", "WORKER_TOKEN")

	app := server.Create(ctx)
	go func() {
		<-ctx.Done()
		err := app.Shutdown()
		if err != nil {
			panic(err)
		}
	}()

	host := os.Getenv("HOST") + ":" + os.Getenv("PORT")
	url := "http://" + host + os.Getenv("SERVER_SUB_DIR")
	zerolog.Ctx(ctx).Info().Str("module", "app").Str("url", url).Msg("app started")
	err := app.Listen(host)
	if err != nil {
		panic(err)
	}
}

func runWorker(ctx context.Context) {
	ticker := time.NewTicker(time.Minute * 10)
	for {
		select {
		case t := <-ticker.C:
			if t.Minute() >= 50 {
				worker.Start(ctx)
			}
		case <-ctx.Done():
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

func initDatabase(ctx context.Context) {
	util.CheckEnvs("DATABASE_URL")
	db, err := database.New(ctx, os.Getenv("DATABASE_URL"))
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

func initQuitSignal(ctx context.Context, cancel context.CancelFunc) {
	c := make(chan os.Signal, 1)
	signal.Notify(c, syscall.SIGINT, syscall.SIGTERM)
	sig := <-c
	zerolog.Ctx(ctx).Info().Str("module", "app").Str("signal", sig.String()).Msg("app stopping")
	cancel()
}
