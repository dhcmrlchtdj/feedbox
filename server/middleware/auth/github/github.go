package github

import (
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/pkg/errors"
	"golang.org/x/oauth2"
	oauth2Github "golang.org/x/oauth2/github"
)

type Profile struct {
	ID    int64  `json:"id"`
	Email string `json:"email,omitempty"`
}

type Config struct {
	ClientID     string
	ClientSecret string
}

func New(cfg Config) fiber.Handler {
	conf := &oauth2.Config{
		ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
		ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		Endpoint:     oauth2Github.Endpoint,
		Scopes:       []string{"user:email"},
	}

	fetchProfile := func(code string) (*Profile, error) {
		authToken, err := conf.Exchange(oauth2.NoContext, code)
		if err != nil {
			return nil, errors.Wrap(err, "github login exchange")
		}
		client := conf.Client(oauth2.NoContext, authToken)

		profile, err := getProfile(client)
		if err != nil {
			return nil, errors.Wrap(err, "github login profile")
		}
		if profile.Email == "" {
			email, err := getEmail(client)
			if err != nil {
				return nil, errors.Wrap(err, "github login email")
			}
			profile.Email = email
		}

		return profile, nil
	}

	return func(c *fiber.Ctx) error {
		code := c.Query("code")
		if code == "" {
			url := conf.AuthCodeURL("state")
			return c.Redirect(url)
		} else {
			profile, err := fetchProfile(code)
			if err != nil {
				return fiber.NewError(fiber.StatusUnauthorized, err.Error())
			}
			c.Locals("credential", profile)
			return c.Next()
		}
	}
}
