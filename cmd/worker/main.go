package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"

	"github.com/dhcmrlchtdj/feedbox/database"
	"github.com/dhcmrlchtdj/feedbox/service/email"
	"github.com/dhcmrlchtdj/feedbox/service/monitor"
	"github.com/dhcmrlchtdj/feedbox/service/telegram"
	"github.com/dhcmrlchtdj/feedbox/util"
	"github.com/dhcmrlchtdj/feedbox/worker"
)

func main() {
	if os.Getenv("ENV") != "prod" {
		if err := godotenv.Load("./dotenv"); err != nil {
			log.Fatalln(err)
		}
	}
	err := util.CheckEnvs(
		"ENV",
		"MAILGUN_DOMAIN",
		"MAILGUN_API_KEY",
		"MAILGUN_FROM",
		"TELEGRAM_WEBHOOK_PATH",
		"TELEGRAM_BOT_TOKEN",
		"TELEGRAM_BOT_NAME",
		"ROLLBAR_TOKEN",
		"DATABASE_URL")
	if err != nil {
		log.Fatalln(err)
	}

	database.Init()
	defer database.Client.Close()
	email.Init()
	monitor.Init()
	telegram.Init()

	worker.Start()
}
