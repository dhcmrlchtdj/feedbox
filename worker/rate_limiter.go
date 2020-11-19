package worker

import "time"

// https://github.com/vitessio/vitess/blob/v8.0.0/LICENSE
// https://github.com/vitessio/vitess/blob/v8.0.0/go/ratelimiter/ratelimiter.go

type RateLimiter struct {
	interval time.Duration
	maxCount int
	curCount int
	lastTime time.Time
}

// The effective rate limit is equal to maxCount/interval.
func NewRateLimiter(maxCount int, interval time.Duration) *RateLimiter {
	return &RateLimiter{
		interval: interval,
		maxCount: maxCount,
	}
}

func (rl *RateLimiter) Wait() {
	delta := rl.interval - time.Since(rl.lastTime)
	if delta > 0 {
		if rl.curCount > 0 {
			rl.curCount--
		} else {
			time.Sleep(delta)
		}
	} else {
		rl.curCount = rl.maxCount - 1
		rl.lastTime = time.Now()
	}
}
