package worker

import "sync"

func parallel(n int, worker func()) {
	var wg sync.WaitGroup

	for range n {
		wg.Go(worker)
	}

	wg.Wait()
}
