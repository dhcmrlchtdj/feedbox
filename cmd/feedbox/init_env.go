package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"github.com/rs/xid"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/pkgerrors"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/email"
	"github.com/dhcmrlchtdj/feedbox/internal/sign"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
	"github.com/dhcmrlchtdj/feedbox/internal/util"
)

func initEnv() {
	if os.Getenv("ENV") != "prod" {
		if err := godotenv.Load("./dotenv"); err != nil {
			panic(err)
		}
	}
	util.CheckEnvs("ENV")
}

type LogIdHook struct{}

func (LogIdHook) Run(e *zerolog.Event, _ zerolog.Level, _ string) {
	e.Str("logId", xid.New().String())
}

func initLogger() zerolog.Logger {
	zerolog.ErrorStackMarshaler = pkgerrors.MarshalStack // nolint:reassign
	logger := zerolog.New(os.Stderr).With().Timestamp().Logger()
	logger = logger.Hook(LogIdHook{})
	return logger
}

func initDatabase(ctx context.Context) {
	util.CheckEnvs("DATABASE_URL")
	db, err := database.New(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		panic(err)
	}
	database.Init(db)
}

func initEmail() {
	if os.Getenv("ENV") == "prod" {
		if util.CheckEnvsExist("MAILCHANNELS_URL", "MAILCHANNELS_USERNAME", "MAILCHANNELS_PASSWORD") {
			email.Init(email.NewMailChannels(
				os.Getenv("MAILCHANNELS_URL"),
				os.Getenv("MAILCHANNELS_USERNAME"),
				os.Getenv("MAILCHANNELS_PASSWORD"),
			))
			return
		} else if util.CheckEnvsExist("MAILGUN_DOMAIN", "MAILGUN_API_KEY", "MAILGUN_FROM") {
			email.Init(email.NewMailgun(
				os.Getenv("MAILGUN_DOMAIN"),
				os.Getenv("MAILGUN_API_KEY"),
				os.Getenv("MAILGUN_FROM"),
			))
			return
		}
	}
	email.Init(email.NewDryRun())
}

func initTelegram() {
	if os.Getenv("ENV") == "prod" {
		util.CheckEnvs("SERVER")
		if util.CheckEnvsExist("TELEGRAM_BOT_NAME", "TELEGRAM_BOT_TOKEN") {
			telegram.Init(telegram.NewHTTPClient(
				os.Getenv("TELEGRAM_BOT_NAME"),
				os.Getenv("TELEGRAM_BOT_TOKEN"),
			))
			return
		}
	}
	telegram.Init(telegram.NewDryRun())
}

func initSign() {
	util.CheckEnvs("COOKIE_SECRET")
	s, err := sign.NewWithPassword(os.Getenv("COOKIE_SECRET"))
	if err != nil {
		panic(err)
	}
	sign.Init(s)
}

///

func initQuitSignal(ctx context.Context, cancel context.CancelFunc) {
	c := make(chan os.Signal, 1)
	signal.Notify(c, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		select {
		case sig := <-c:
			zerolog.Ctx(ctx).Info().Str("module", "app").Str("signal", sig.String()).Msg("app stopping")
			cancel()
		case <-ctx.Done():
			return
		}
	}()
}
