package worker

import "sync"

func parallel(n int, worker func()) {
	var wg sync.WaitGroup

	for range n {
		wg.Add(1)
		go func() {
			defer wg.Done()
			worker()
		}()
	}

	wg.Wait()
}
