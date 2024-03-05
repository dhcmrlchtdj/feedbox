package handler

import (
	"context"
	"encoding/json"
	"io/fs"
	"mime"
	"net/http"
	"path/filepath"
	"strconv"
	"sync"

	"github.com/gofiber/fiber/v2"
	"github.com/pkg/errors"
	"github.com/rs/zerolog"
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

func StaticWithMaxAge(seconds int) fiber.Handler {
	return StaticWithHeader(
		"cache-control",
		"public, must-revalidate, max-age="+strconv.Itoa(seconds),
	)
}

type customHeader struct {
	Header []struct {
		Key   string `json:"key"`
		Value string `json:"value"`
	} `json:"header"`
}

func StaticWithCustomHeader(filename string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		content, err := frontendReadFile(filename)
		if err != nil {
			return err
		}

		var h customHeader
		err = json.Unmarshal(content, &h)
		if err != nil {
			return errors.WithStack(err)
		}

		for _, kv := range h.Header {
			c.Set(kv.Key, kv.Value)
		}

		return nil
	}
}

func sendFile(c *fiber.Ctx, filename string, handlers ...fiber.Handler) error {
	ctx := c.UserContext()
	content, err := frontendReadFile(filename)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return fiber.ErrNotFound
		}

		inner := errors.Unwrap(err)
		if inner != nil && inner.Error() == "is a directory" {
			return fiber.ErrNotFound
		} else {
			zerolog.Ctx(ctx).Error().
				Str("module", "server").
				Stack().
				Err(err).
				Send()
			return fiber.ErrNotFound
		}
	}
	if err := c.Send(content); err != nil {
		return err
	}

	// set content-type by extension
	ext := filepath.Ext(filename)
	addMissingMIME(ctx)
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

var onceMine sync.Once

func addMissingMIME(ctx context.Context) {
	onceMine.Do(func() {
		err := mime.AddExtensionType(".webmanifest", "application/manifest+json; charset=utf-8")
		if err != nil {
			zerolog.Ctx(ctx).Error().
				Str("module", "server").
				Stack().
				Err(err).
				Send()
		}
	})
}
