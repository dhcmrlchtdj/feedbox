package worker_test

import (
	"testing"
	"time"

	"github.com/dhcmrlchtdj/feedbox/worker"
)

func TestRateLimiter(t *testing.T) {
	t.Run("basic", func(t *testing.T) {
		rl := worker.NewRateLimiter(5, 100*time.Millisecond)
		start := time.Now()
		for range 5 {
			rl.Wait()
		}
		elapsed := time.Since(start)
		if elapsed > 50*time.Millisecond {
			t.Errorf("expected no delay for first 5 calls, took %v", elapsed)
		}

		rl.Wait()
		elapsed = time.Since(start)
		if elapsed < 100*time.Millisecond {
			t.Errorf("expected delay for 6th call, took %v", elapsed)
		}
	})

	t.Run("reset", func(t *testing.T) {
		rl := worker.NewRateLimiter(1, 100*time.Millisecond)
		rl.Wait()
		time.Sleep(150 * time.Millisecond)
		start := time.Now()
		rl.Wait()
		elapsed := time.Since(start)
		if elapsed > 50*time.Millisecond {
			t.Errorf("expected no delay after reset, took %v", elapsed)
		}
	})
}
