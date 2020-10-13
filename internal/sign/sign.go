package sign

import (
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"

	"golang.org/x/crypto/chacha20poly1305"
)

type Sign struct {
	aead cipher.AEAD
}

func New(secret string) (*Sign, error) {
	key, err := hex.DecodeString(secret)
	if err != nil {
		return nil, err
	}
	aead, err := chacha20poly1305.NewX(key)
	if err != nil {
		return nil, err
	}
	return &Sign{aead}, nil
}

func (s *Sign) Encode(plaintext []byte) ([]byte, error) {
	nonce := make([]byte, s.aead.NonceSize(), s.aead.NonceSize()+len(plaintext)+s.aead.Overhead())
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}
	ciphertext := s.aead.Seal(nonce, nonce, plaintext, nil)
	return ciphertext, nil
}

func (s *Sign) Decode(data []byte) ([]byte, error) {
	nonce, ciphertext := data[:s.aead.NonceSize()], data[s.aead.NonceSize():]
	plaintext, err := s.aead.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, err
	}
	return plaintext, nil
}

func (s *Sign) DecodeFromBase64(b64data string) ([]byte, error) {
	ciphertext, err := base64.StdEncoding.DecodeString(b64data)
	if err != nil {
		return nil, err
	}
	return s.Decode(ciphertext)
}

func (s *Sign) EncodeToBase64(plaintext []byte) (string, error) {
	ciphertext, err := s.Encode(plaintext)
	if err != nil {
		return "", err
	}
	text := base64.StdEncoding.EncodeToString(ciphertext)
	return text, nil
}
