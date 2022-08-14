package handler

import (
	"github.com/gofiber/fiber/v2"
)

func StaticWithoutCache(filename string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Request().Header.Del("If-Modified-Since")
		if err := c.SendFile(filename); err != nil {
			return err
		}
		c.Set("cache-control", "no-cache, must-revalidate")
		return nil
	}
}

func StaticWithCache(dirname string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		filename := c.Params("filename")
		c.Request().Header.Del("If-Modified-Since")
		if err := c.SendFile(dirname + filename); err != nil {
			return err
		}
		c.Set("cache-control", "max-age=31536000, must-revalidate") // 60*60*24*365 = 365day
		return nil
	}
}

func StaticRobots(c *fiber.Ctx) error {
	c.Set("cache-control", "max-age=604800, must-revalidate") // 60*60*24*7 = 7day
	return c.SendString("User-agent: *")
}

func StaticFavicon(c *fiber.Ctx) error {
	c.Set("content-type", "image/svg+xml")
	c.Set("cache-control", "max-age=604800, must-revalidate") // 60*60*24*7 = 7day
	icon := `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2"><circle cx="1" cy="1" r="1" fill="hsl(50,100%,75%)"/></svg>`
	return c.SendString(icon)
}
