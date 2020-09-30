package main

import (
	"log"
	"os"
	"sync/atomic"
	"time"

	"github.com/joho/godotenv"

	"github.com/dhcmrlchtdj/feedbox/database"
	"github.com/dhcmrlchtdj/feedbox/server"
	"github.com/dhcmrlchtdj/feedbox/service/monitor"
	"github.com/dhcmrlchtdj/feedbox/service/telegram"
	"github.com/dhcmrlchtdj/feedbox/util"
)

func main() {
	if os.Getenv("ENV") != "prod" {
		if err := godotenv.Load("./dotenv"); err != nil {
			log.Fatalln(err)
		}
	}
	err := util.CheckEnvs(
		"ENV",
		"SERVER",
		"PORT",
		"COOKIE_SECRET",
		"GITHUB_CLIENT_ID",
		"GITHUB_CLIENT_SECRET",
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
	monitor.Init()
	telegram.Init()

	var abort uint32 = 0 // 1 == aborted
	done := make(chan bool)

	if os.Getenv("ENV") == "prod" {
		go func() {
			time.Sleep(time.Second)
			if atomic.LoadUint32(&abort) == 0 {
				if err := telegram.RegisterWebhook(); err != nil {
					monitor.Client.Error(err)
				}
			}
			done <- true
		}()
	}

	app := server.Create()
	if err := app.Listen(":" + os.Getenv("PORT")); err != nil {
		atomic.StoreUint32(&abort, 1)
		log.Fatalln(err)
	}

	<-done
}
