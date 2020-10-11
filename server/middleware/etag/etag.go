package etag

import (
	"encoding/hex"
	"strings"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/blake2b"
)

func match(clientEtag string, serverEtag string) bool {
	if strings.HasPrefix(clientEtag, "W/") {
		return clientEtag[2:] == serverEtag
	}
	return clientEtag == serverEtag
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
		sum := blake2b.Sum256(body)
		serverEtag := "\"" + hex.EncodeToString(sum[:16]) + "\""

		if match(clientEtag, serverEtag) {
			c.Status(fiber.StatusNotModified)
			c.Send(nil)
		} else {
			c.Set("etag", "W/"+serverEtag)
		}

		return nil
	}
}
