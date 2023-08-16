//go:build !dev

package github

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/morikuni/failure"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

func New(cfg Config) fiber.Handler {
	conf := &oauth2.Config{
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		Endpoint:     github.Endpoint,
		Scopes:       []string{"user:email"},
	}

	fetchProfile := func(ctx context.Context, code string) (*Profile, error) {
		authToken, err := conf.Exchange(ctx, code)
		if err != nil {
			return nil, failure.Wrap(err, failure.Message("github login exchange"))
		}
		client := conf.Client(ctx, authToken)

		profile, err := getProfile(ctx, client)
		if err != nil {
			return nil, failure.Wrap(err, failure.Message("github login profile"))
		}

		email, err := getEmail(ctx, client)
		if err != nil {
			return nil, failure.Wrap(err, failure.Message("github login email"))
		}
		profile.Email = email

		return profile, nil
	}

	return func(c *fiber.Ctx) error {
		code := c.Query("code")
		if code == "" {
			url := conf.AuthCodeURL("state")
			return c.Redirect(url)
		}
		profile, err := fetchProfile(c.UserContext(), code)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, err.Error())
		}
		c.Locals("credential", profile)
		return c.Next()
	}
}
