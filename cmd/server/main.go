package main

import (
	"os"
	"sync/atomic"
	"time"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/global"
	"github.com/dhcmrlchtdj/feedbox/internal/monitor"
	"github.com/dhcmrlchtdj/feedbox/internal/sign"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
	"github.com/dhcmrlchtdj/feedbox/internal/telegrambot"
	"github.com/dhcmrlchtdj/feedbox/internal/util"
	"github.com/dhcmrlchtdj/feedbox/server"
)

func main() {
	var err error

	if os.Getenv("ENV") != "prod" {
		if err = godotenv.Load("./dotenv"); err != nil {
			panic(err)
		}
	}
	util.CheckEnvs("ENV")

	zerolog.TimestampFieldName = "t"
	zerolog.LevelFieldName = "l"
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	if os.Getenv("ENV") == "dev" {
		zerolog.TimeFieldFormat = time.RFC3339
		log.Logger = log.Output(ZerologPrettyPrint)
	}

	util.CheckEnvs("DATABASE_URL")
	global.DB, err = database.New(
		os.Getenv("DATABASE_URL"),
		database.WithMaxConns(10),
		database.WithLogger("info", log.Logger))
	if err != nil {
		panic(err)
	}
	defer global.DB.Close()

	util.CheckEnvs("ROLLBAR_TOKEN")
	global.Monitor = monitor.New(os.Getenv("ROLLBAR_TOKEN"))

	util.CheckEnvs("SERVER")
	util.CheckEnvs("TELEGRAM_BOT_NAME", "TELEGRAM_BOT_TOKEN")
	global.TG = telegram.New(os.Getenv("TELEGRAM_BOT_NAME"), os.Getenv("TELEGRAM_BOT_TOKEN"))

	util.CheckEnvs("COOKIE_SECRET")
	global.Sign, err = sign.New(os.Getenv("COOKIE_SECRET"))
	if err != nil {
		panic(err)
	}

	util.CheckEnvs("PORT")
	util.CheckEnvs("GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET")
	var abort uint32 = 0 // 1 == aborted
	done := make(chan struct{}, 1)
	go func() {
		time.Sleep(time.Second)
		if os.Getenv("ENV") == "prod" && atomic.LoadUint32(&abort) == 0 {
			if err := telegrambot.RegisterWebhook(); err != nil {
				global.Monitor.Error(err)
			}
		}
		done <- struct{}{}
	}()

	app := server.Create()
	if err := app.Listen(":" + os.Getenv("PORT")); err != nil {
		atomic.StoreUint32(&abort, 1)
		global.Monitor.Error(err)
		<-done
		panic(err)
	}
}
