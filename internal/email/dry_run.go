package email

import (
	"context"

	"github.com/rs/zerolog"
)

var _ Client = (*dryRun)(nil)

type dryRun struct{}

func NewDryRun() *dryRun {
	return &dryRun{}
}

func (*dryRun) Send(ctx context.Context, addr string, subject string, text string) error {
	zerolog.Ctx(ctx).Debug().
		Str("module", "email").
		Str("addr", addr).
		Str("subject", subject).
		Str("text", text).
		Send()
	return nil
}
