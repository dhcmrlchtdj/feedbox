package main

import (
	"os"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/email"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
	"github.com/dhcmrlchtdj/feedbox/internal/util"
	"github.com/dhcmrlchtdj/feedbox/worker"
)

func main() {
	if os.Getenv("ENV") != "prod" {
		if err := godotenv.Load("./dotenv"); err != nil {
			panic(err)
		}
	}
	util.CheckEnvs("ENV")

	util.CheckEnvs("DATABASE_URL")
	db, err := database.New(os.Getenv("DATABASE_URL"), &log.Logger)
	if err != nil {
		panic(err)
	}
	database.C = db
	defer db.Close()

	util.CheckEnvs("MAILGUN_DOMAIN", "MAILGUN_API_KEY", "MAILGUN_FROM")
	if os.Getenv("ENV") == "prod" {
		email.C = email.NewMailgun(os.Getenv("MAILGUN_DOMAIN"), os.Getenv("MAILGUN_API_KEY"), os.Getenv("MAILGUN_FROM"))
	} else {
		email.C = email.NewDryRun(os.Getenv("MAILGUN_DOMAIN"), os.Getenv("MAILGUN_API_KEY"), os.Getenv("MAILGUN_FROM"))
	}

	util.CheckEnvs("TELEGRAM_BOT_NAME", "TELEGRAM_BOT_TOKEN")
	if os.Getenv("ENV") == "prod" {
		telegram.C = telegram.NewHttpClient(os.Getenv("TELEGRAM_BOT_NAME"), os.Getenv("TELEGRAM_BOT_TOKEN"))
	} else {
		telegram.C = telegram.NewDryRun(os.Getenv("TELEGRAM_BOT_NAME"), os.Getenv("TELEGRAM_BOT_TOKEN"))
	}

	worker.Start()
}
