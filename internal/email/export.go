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

func Default() Client {
	return *defaultImpl.Load()
}

func Init(c Client) {
	defaultImpl.Store(&c)
}

///

func Send(ctx context.Context, addr string, subject string, text string) error {
	return Default().Send(ctx, addr, subject, text)
}
