package main

import (
	"context"
	"flag"
	"fmt"
	"net"
	"os"
	"sync"
	"time"

	"github.com/rs/zerolog"

	"github.com/dhcmrlchtdj/feedbox/internal/global"
	"github.com/dhcmrlchtdj/feedbox/internal/util"
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

	initEnv()
	initLogger()
	initDatabase(ctx)
	defer global.Database.Close()
	initEmail()
	initTelegram()
	initSign()
	initQuitSignal(ctx, cancel)

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
	initQuitSignal(ctx, cancel)

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

///

func runServer(ctx context.Context) {
	util.CheckEnvs("GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET")
	util.CheckEnvs("HOST", "PORT", "TELEGRAM_WEBHOOK_PATH")

	app := server.Create(ctx)
	go func() {
		<-ctx.Done()
		err := app.Shutdown()
		if err != nil {
			panic(err)
		}
	}()

	host := net.JoinHostPort(os.Getenv("HOST"), os.Getenv("PORT"))
	url := "http://" + host + os.Getenv("SERVER_SUB_DIR")
	zerolog.Ctx(ctx).Info().Str("module", "app").Str("url", url).Msg("app started")
	err := app.Listen(host)
	if err != nil {
		panic(err)
	}
}

func runWorker(ctx context.Context) {
	util.CheckEnvs("SERVER")

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
