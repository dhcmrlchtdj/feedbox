package email

import (
	"context"
	"sync/atomic"
)

type Client interface {
	Send(ctx context.Context, addr string, subject string, text string) error
}

///

var defaultImpl atomic.Pointer[Client]

func init() {
	var dryrun Client = NewDryRun()
	defaultImpl.Store(&dryrun)
}

func Default() Client {
	return *defaultImpl.Load()
}

func SetDefault(c Client) {
	defaultImpl.Store(&c)
}

///

func Send(ctx context.Context, addr string, subject string, text string) error {
	return Default().Send(ctx, addr, subject, text)
}
