package etag

import (
	"strconv"
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
		if c.Method() != fiber.MethodGet {
			return nil
		}

		resp := c.Response()
		if resp.StatusCode() != fiber.StatusOK {
			return nil
		}

		body := resp.Body()
		if len(body) <= 0 {
			return nil
		}

		clientETags := c.Get("if-none-match")

		sum := xxhash.Sum64(body)
		serverETag := strconv.FormatUint(sum, 16)
		c.Set("etag", serverETag)

		if strings.Contains(clientETags, serverETag) {
			return c.Status(fiber.StatusNotModified).Send(nil)
		}

		return nil
	}
}
