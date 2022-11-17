package email

import "context"

type Client interface {
	Send(ctx context.Context, addr string, subject string, text string) error
}
