package handler

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"log"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/chacha20poly1305"

	db "github.com/dhcmrlchtdj/feedbox/database"
	"github.com/dhcmrlchtdj/feedbox/server/middleware/auth/github"
	"github.com/dhcmrlchtdj/feedbox/server/typing"
)

func Logout(c *fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    "",
		Path:     "/api",
		MaxAge:   1,
		Secure:   true,
		HTTPOnly: true,
		SameSite: "strict",
	})
	return c.Redirect("/")
}

func ConnectGithub(cookieSecret string) fiber.Handler {
	key, err := hex.DecodeString(cookieSecret)
	if err != nil {
		log.Fatalln(err)
	}
	aead, err := chacha20poly1305.NewX(key)
	if err != nil {
		log.Fatalln(err)
	}

	return func(c *fiber.Ctx) error {
		credential := c.Locals("credential").(*github.Profile)
		id := strconv.FormatInt(credential.ID, 10)
		user, err := db.Client.GetOrCreateUserByGithub(id, credential.Email)
		if err != nil {
			return err
		}
		token := typing.Credential{
			UserID:    user.ID,
			ExpiresAt: time.Now().Add(time.Hour * 24 * 3).Unix(),
		}

		plaintext, err := json.Marshal(token)
		if err != nil {
			return err
		}
		nonce := make([]byte, aead.NonceSize(), aead.NonceSize()+len(plaintext)+aead.Overhead())
		if _, err := rand.Read(nonce); err != nil {
			return err
		}
		ciphertext := aead.Seal(nonce, nonce, plaintext, nil)
		tokenStr := base64.StdEncoding.EncodeToString(ciphertext)

		c.Cookie(&fiber.Cookie{
			Name:     "token",
			Value:    tokenStr,
			Path:     "/api",
			MaxAge:   int((time.Hour * 24 * 3) / time.Second),
			Secure:   true,
			HTTPOnly: true,
			SameSite: "strict",
		})

		return c.Redirect("/")
	}
}
