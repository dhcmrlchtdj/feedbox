package cookie

import (
	"context"
	"encoding/json"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/morikuni/failure"
	"github.com/rs/zerolog"

	"github.com/dhcmrlchtdj/feedbox/internal/global"
)

type Config struct {
	Validator func(ctx context.Context, token string) (any, error)
	Name      string
}

func New(cfg Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Cookies(cfg.Name)
		if token == "" {
			return fiber.ErrUnauthorized
		}

		ctx := c.UserContext()
		credential, err := cfg.Validator(ctx, token)
		if err != nil {
			Clear(c)
			zerolog.Ctx(ctx).Trace().
				Str("module", "server.auth.cookie").
				Stack().
				Err(err).
				Send()
			return fiber.NewError(fiber.StatusUnauthorized, err.Error())
		}

		c.Locals("credential", credential)

		return c.Next()
	}
}

///

func Set(c *fiber.Ctx, cookie string) {
	c.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    cookie,
		Path:     "/api",
		MaxAge:   int((time.Hour * 24 * 3) / time.Second),
		Secure:   true,
		HTTPOnly: true,
		SameSite: "strict",
	})
}

func Clear(c *fiber.Ctx) {
	c.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    "",
		Path:     "/api",
		Expires:  time.Date(1970, time.January, 1, 0, 0, 0, 0, time.UTC),
		Secure:   true,
		HTTPOnly: true,
		SameSite: "strict",
	})
}

///

type UserProfile struct {
	UserID    int64
	ExpiresAt int64
}

func EncodeToToken(userID int64) (string, error) {
	token := UserProfile{
		UserID:    userID,
		ExpiresAt: time.Now().Add(time.Hour * 24 * 3).Unix(),
	}

	plaintext, err := json.Marshal(token)
	if err != nil {
		return "", err
	}
	tokenStr, err := global.Sign.EncodeToHex(plaintext)
	if err != nil {
		return "", err
	}

	return tokenStr, nil
}

func DecodeFromToken(tokenStr string) (UserProfile, error) {
	var user UserProfile

	plaintext, err := global.Sign.DecodeFromHex(tokenStr)
	if err != nil {
		return user, failure.Unexpected("InvalidToken")
	}

	if err := json.Unmarshal(plaintext, &user); err != nil {
		return user, failure.Unexpected("BrokenToken")
	}

	if time.Now().Unix() > user.ExpiresAt {
		return user, failure.Unexpected("ExpiredToken")
	}

	return user, nil
}
