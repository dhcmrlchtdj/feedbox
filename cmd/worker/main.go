package main

import (
	"os"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/email"
	"github.com/dhcmrlchtdj/feedbox/internal/global"
	"github.com/dhcmrlchtdj/feedbox/internal/monitor"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
	"github.com/dhcmrlchtdj/feedbox/internal/util"
	"github.com/dhcmrlchtdj/feedbox/worker"
)

func main() {
	var err error

	if os.Getenv("ENV") != "prod" {
		if err = godotenv.Load("./dotenv"); err != nil {
			panic(err)
		}
	}
	util.CheckEnvs("ENV")

	util.CheckEnvs("DATABASE_URL")
	global.DB, err = database.New(os.Getenv("DATABASE_URL"), database.WithMaxConns(10), database.WithLogger("info", log.Logger))
	if err != nil {
		panic(err)
	}
	defer global.DB.Close()

	util.CheckEnvs("ROLLBAR_TOKEN")
	global.Monitor = monitor.New(os.Getenv("ROLLBAR_TOKEN"))

	util.CheckEnvs("MAILGUN_DOMAIN", "MAILGUN_API_KEY", "MAILGUN_FROM")
	global.Email = email.New(os.Getenv("MAILGUN_DOMAIN"), os.Getenv("MAILGUN_API_KEY"), os.Getenv("MAILGUN_FROM"))

	util.CheckEnvs("TELEGRAM_BOT_NAME", "TELEGRAM_BOT_TOKEN")
	global.TG = telegram.New(os.Getenv("TELEGRAM_BOT_NAME"), os.Getenv("TELEGRAM_BOT_TOKEN"))

	worker.Start()
}
