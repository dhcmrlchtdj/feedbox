package monitor

import (
	"os"

	"github.com/rollbar/rollbar-go"
	"github.com/rs/zerolog/log"
)

var C *Client = nil

type Client struct{}

func New(token string) *Client {
	if os.Getenv("ENV") != "prod" {
		rollbar.SetEnabled(false)
	}
	rollbar.SetToken(token)
	rollbar.SetEnvironment("production")

	return &Client{}
}

func (*Client) Flush() {
	rollbar.Wait()
}

func (*Client) Error(err error) {
	log.Error().Str("module", "monitor").Err(err).Send()
	rollbar.Error(err)
}

func (*Client) Warn(err error) {
	log.Warn().Str("module", "monitor").Err(err).Send()
	rollbar.Warning(err)
}
