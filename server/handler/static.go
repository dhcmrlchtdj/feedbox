package handler

import (
	"encoding/json"
	"io/fs"
	"mime"
	"net/http"
	"path/filepath"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/frontend"
	"github.com/dhcmrlchtdj/feedbox/internal/monitor"
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

func StaticWithHeader(key string, val string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Set(key, val)
		return nil
	}
}

func StaticWithMaxAge(maxAge int) fiber.Handler {
	return StaticWithHeader("cache-control", "must-revalidate, max-age="+strconv.Itoa(maxAge))
}

type customHeader struct {
	Header []struct {
		Key   string `json:"key"`
		Value string `json:"value"`
	} `json:"header"`
}

func StaticWithCustomHeader(filename string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		content, err := frontend.Static.ReadFile(filename)
		if err != nil {
			return err
		}

		var h customHeader
		err = json.Unmarshal(content, &h)
		if err != nil {
			return err
		}

		for _, kv := range h.Header {
			c.Set(kv.Key, kv.Value)
		}

		return nil
	}
}

func sendFile(c *fiber.Ctx, filename string, handlers ...fiber.Handler) error {
	content, err := frontend.Static.ReadFile(filename)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return fiber.ErrNotFound
		} else {
			inner := errors.Unwrap(err)
			if inner != nil && inner.Error() == "is a directory" {
				return fiber.ErrNotFound
			} else {
				monitor.C.Error(err)
				return fiber.ErrNotFound
			}
		}
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
