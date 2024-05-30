package proc

import (
	"context"
	"sync"
)

var (
	Context, Cancel = context.WithCancel(context.Background())
	WaitGroup       = sync.WaitGroup{}
)
