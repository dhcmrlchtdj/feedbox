package monitor

import (
	"os"

	"github.com/rollbar/rollbar-go"
)

type Client struct{}

func New(token string) *Client {
	if os.Getenv("ENV") != "prod" {
		rollbar.SetEnabled(false)
	}
	rollbar.SetToken(token)
	rollbar.SetEnvironment("production")

	return &Client{}
}

func (*Client) Error(err error) {
	rollbar.Error(err)
}
