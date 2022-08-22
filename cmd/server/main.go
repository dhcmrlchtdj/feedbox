package main

import (
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/email"
	"github.com/dhcmrlchtdj/feedbox/internal/monitor"
	"github.com/dhcmrlchtdj/feedbox/internal/sign"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
	"github.com/dhcmrlchtdj/feedbox/internal/util"
	"github.com/dhcmrlchtdj/feedbox/server"
)

func main() {
	if os.Getenv("ENV") != "prod" {
		if err := godotenv.Load("./dotenv"); err != nil {
			panic(err)
		}
	}
	util.CheckEnvs("ENV")

	zerolog.TimestampFieldName = "t"
	zerolog.LevelFieldName = "l"
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	if os.Getenv("ENV") == "dev" {
		zerolog.TimeFieldFormat = time.RFC3339
		log.Logger = log.Output(util.JSONConsoleWriter{Out: os.Stderr})
	}

	util.CheckEnvs("DATABASE_URL")
	db, err := database.New(
		os.Getenv("DATABASE_URL"),
		database.WithMaxConns(10),
		database.WithLogger("info", &log.Logger))
	if err != nil {
		panic(err)
	}
	database.C = db
	defer db.Close()

	util.CheckEnvs("ROLLBAR_TOKEN")
	monitor.C = monitor.New(os.Getenv("ROLLBAR_TOKEN"))
	defer monitor.C.Flush()

	util.CheckEnvs("MAILGUN_DOMAIN", "MAILGUN_API_KEY", "MAILGUN_FROM")
	email.C = email.New(os.Getenv("MAILGUN_DOMAIN"), os.Getenv("MAILGUN_API_KEY"), os.Getenv("MAILGUN_FROM"))

	util.CheckEnvs("SERVER")
	util.CheckEnvs("TELEGRAM_BOT_NAME", "TELEGRAM_BOT_TOKEN")
	telegram.C = telegram.New(os.Getenv("TELEGRAM_BOT_NAME"), os.Getenv("TELEGRAM_BOT_TOKEN"))

	util.CheckEnvs("COOKIE_SECRET")
	sign.S, err = sign.New(os.Getenv("COOKIE_SECRET"))
	if err != nil {
		panic(err)
	}

	util.CheckEnvs("GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET")
	util.CheckEnvs("PORT", "TELEGRAM_WEBHOOK_PATH", "WORKER_TOKEN")
	app := server.Create()
	host := ":" + os.Getenv("PORT")
	if os.Getenv("ENV") != "prod" {
		host = "127.0.0.1" + host
	}
	if err := app.Listen(host); err != nil {
		panic(err)
	}
}
