package handler

import (
	"mime"
	"net/http"
	"path/filepath"
	"strconv"

	"github.com/gofiber/fiber/v2"

	"github.com/dhcmrlchtdj/feedbox/frontend"
)

func StaticFile(filename string, handlers ...fiber.Handler) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return sendFile(c, filename, handlers...)
	}
}

func StaticDir(dirname string, handlers ...fiber.Handler) fiber.Handler {
	return func(c *fiber.Ctx) error {
		filename := c.Params("filename")
		return sendFile(c, filepath.Join(dirname, filename), handlers...)
	}
}

func StaticWithMaxAge(maxAge int) fiber.Handler {
	return setHeader("cache-control", "must-revalidate, max-age="+strconv.Itoa(maxAge))
}

func sendFile(c *fiber.Ctx, filename string, handlers ...fiber.Handler) error {
	content, err := frontend.Static.ReadFile(filename)
	if err != nil {
		return err
	}
	if err := c.Send(content); err != nil {
		return err
	}

	// set content-type by extension
	ext := filepath.Ext(filename)
	contentType := mime.TypeByExtension(ext)
	if contentType == "" {
		contentType = http.DetectContentType(content)
	}
	c.Set("content-type", contentType)

	// set 'no-cache' by default
	c.Set("cache-control", "no-cache")

	for _, h := range handlers {
		if err := h(c); err != nil {
			return err
		}
	}

	return nil
}

func setHeader(key string, val string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Set(key, val)
		return nil
	}
}
