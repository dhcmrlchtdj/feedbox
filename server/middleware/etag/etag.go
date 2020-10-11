package etag

import (
	"fmt"
	"strings"

	"github.com/cespare/xxhash/v2"
	"github.com/gofiber/fiber/v2"
)

// https://www.w3.org/Protocols/HTTP/1.1/rfc2616bis/issues/#i71
func match(clientEtag string, serverEtag string) bool {
	if strings.HasPrefix(clientEtag, "W/") {
		return clientEtag[2:] == serverEtag[2:]
	}
	return clientEtag == serverEtag[2:]
}

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
		serverEtag := fmt.Sprintf("W/\"%016x\"", sum)

		c.Set("etag", serverEtag)
		if match(clientEtag, serverEtag) {
			c.Status(fiber.StatusNotModified)
			c.Send(nil)
		}

		return nil
	}
}
