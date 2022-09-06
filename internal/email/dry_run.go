package email

import "github.com/rs/zerolog/log"

var _ client = (*dryRun)(nil)

type dryRun struct{}

func NewDryRun(domain string, apiKey string, from string) *dryRun {
	return &dryRun{}
}

func (*dryRun) Send(addr string, subject string, text string) error {
	log.Debug().
		Str("module", "email").
		Str("addr", addr).
		Str("subject", subject).
		Str("text", text).
		Send()
	return nil
}
