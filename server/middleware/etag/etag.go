package etag

import (
	"fmt"
	"hash/crc32"
	"strings"

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
		crc32q := crc32.MakeTable(0xD5828281)
		etag := fmt.Sprintf("\"%d-%v\"", len(body), crc32.Checksum(body, crc32q))

		// Check if client's ETag is weak
		if strings.HasPrefix(clientEtag, "W/") {
			// Check if server's ETag is weak
			if clientEtag[2:] == etag || clientEtag[2:] == etag[2:] {
				// W/1 == 1 || W/1 == W/1
				c.Status(fiber.StatusNotModified)
				c.Send(nil)
			} else {
				// W/1 != W/2 || W/1 != 2
				c.Set("etag", etag)
			}
		} else if strings.Contains(clientEtag, etag) {
			// 1 == 1
			c.Status(fiber.StatusNotModified)
			c.Send(nil)
		} else {
			// 1 != 2
			c.Set("etag", etag)
		}

		return nil
	}
}
