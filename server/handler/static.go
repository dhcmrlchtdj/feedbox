package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func StaticWithCache(directive string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Set("cache-control", directive)
		return nil
	}
}

func StaticWithoutCache() fiber.Handler {
	return StaticWithCache("no-cache")
}

func StaticWithMaxAge(maxAge int) fiber.Handler {
	return StaticWithCache("must-revalidate, max-age=" + strconv.Itoa(maxAge))
}

func StaticFile(filename string, handlers ...fiber.Handler) fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Request().Header.Del("If-Modified-Since")
		if err := c.SendFile(filename); err != nil {
			return err
		}
		for _, h := range handlers {
			if err := h(c); err != nil {
				return err
			}
		}
		return nil
	}
}

func StaticDir(dirname string, handlers ...fiber.Handler) fiber.Handler {
	return func(c *fiber.Ctx) error {
		filename := c.Params("filename")
		c.Request().Header.Del("If-Modified-Since")
		// FIXME: should not concat filename
		if err := c.SendFile(dirname + filename); err != nil {
			return err
		}
		for _, h := range handlers {
			if err := h(c); err != nil {
				return err
			}
		}
		return nil
	}
}
