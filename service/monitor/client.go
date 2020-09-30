package monitor

import (
	"os"

	"github.com/rollbar/rollbar-go"
)

type RollbarClient struct{}

var Client = &RollbarClient{}

func Init() {
	if os.Getenv("ENV") != "prod" {
		rollbar.SetEnabled(false)
	}

	rollbar.SetToken(os.Getenv("ROLLBAR_TOKEN"))
	rollbar.SetEnvironment("production")
}

func (_ *RollbarClient) Error(err error) {
	rollbar.Error(err)
}
