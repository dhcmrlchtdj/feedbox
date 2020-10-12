package etag

import (
	"fmt"
	"strings"

	"github.com/cespare/xxhash/v2"
	"github.com/gofiber/fiber/v2"
)

func New() fiber.Handler {
	return func(c *fiber.Ctx) error {
		err := c.Next()
		if err != nil {
			return err
		}

		resp := c.Response()
		// Don't generate ETags for invalid responses
		if resp.StatusCode() != fiber.StatusOK {
			return nil
		}
		body := resp.Body()
		// Skips ETag if no response body is present
		if len(body) <= 0 {
			return nil
		}
		// Get ETag header from request
		clientEtag := c.Get(fiber.HeaderIfNoneMatch)

		// Generate ETag for response
		sum := xxhash.Sum64(body)
		serverEtag := fmt.Sprintf("W/\"%d-%016x\"", len(body), sum)
		c.Set("etag", serverEtag)

		// https://www.w3.org/Protocols/HTTP/1.1/rfc2616bis/issues/#i71
		if strings.Contains(clientEtag, serverEtag[2:]) {
			return c.Status(fiber.StatusNotModified).Send(nil)
		}

		return nil
	}
}
