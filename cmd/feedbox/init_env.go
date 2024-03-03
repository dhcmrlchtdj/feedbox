package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/pkgerrors"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/email"
	"github.com/dhcmrlchtdj/feedbox/internal/global"
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
	global.Email = email.NewDryRun()
	if os.Getenv("ENV") == "prod" {
		if util.CheckEnvsExist("MAILCHANNELS_URL", "MAILCHANNELS_USERNAME", "MAILCHANNELS_PASSWORD") {
			global.Email = email.NewMailChannels(
				os.Getenv("MAILCHANNELS_URL"),
				os.Getenv("MAILCHANNELS_USERNAME"),
				os.Getenv("MAILCHANNELS_PASSWORD"),
			)
		} else if util.CheckEnvsExist("MAILGUN_DOMAIN", "MAILGUN_API_KEY", "MAILGUN_FROM") {
			global.Email = email.NewMailgun(
				os.Getenv("MAILGUN_DOMAIN"),
				os.Getenv("MAILGUN_API_KEY"),
				os.Getenv("MAILGUN_FROM"),
			)
		}
	}
}

func initTelegram() {
	global.Telegram = telegram.NewDryRun()
	if os.Getenv("ENV") == "prod" {
		util.CheckEnvs("SERVER")
		if util.CheckEnvsExist("TELEGRAM_BOT_NAME", "TELEGRAM_BOT_TOKEN") {
			global.Telegram = telegram.NewHTTPClient(
				os.Getenv("TELEGRAM_BOT_NAME"),
				os.Getenv("TELEGRAM_BOT_TOKEN"),
			)
		}
	}
}

func initSign() {
	util.CheckEnvs("COOKIE_SECRET")
	s, err := sign.NewWithPassword(os.Getenv("COOKIE_SECRET"))
	if err != nil {
		panic(err)
	}
	global.Sign = s
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
