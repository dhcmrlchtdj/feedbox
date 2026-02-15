package worker

import (
	"testing"
	"time"
)

func TestRateLimiter(t *testing.T) {
	t.Run("basic", func(t *testing.T) {
		rl := NewRateLimiter(5, 100*time.Millisecond)
		start := time.Now()
		for i := 0; i < 5; i++ {
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
		rl := NewRateLimiter(1, 100*time.Millisecond)
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
