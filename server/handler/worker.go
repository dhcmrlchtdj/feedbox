package handler

import (
	"sync/atomic"

	"github.com/gofiber/fiber/v2"

	"github.com/dhcmrlchtdj/feedbox/worker"
)

var workerIsRunning atomic.Bool

func WorkerStart(c *fiber.Ctx) error {
	if workerIsRunning.CompareAndSwap(false, true) {
		go func() {
			worker.Start(c.UserContext())
			workerIsRunning.Store(false)
		}()
		return c.SendStatus(201)
	} else {
		return c.SendStatus(200)
	}
}
