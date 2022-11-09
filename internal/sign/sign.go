package sign

import (
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"

	"golang.org/x/crypto/argon2"
	"golang.org/x/crypto/chacha20poly1305"
)

var S interface {
	Encode(plaintext []byte) ([]byte, error)
	Decode(data []byte) ([]byte, error)
	DecodeFromHex(hexData string) ([]byte, error)
	EncodeToHex(plaintext []byte) (string, error)
}

type Sign struct {
	aead cipher.AEAD
}

func New(password string) (*Sign, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return nil, err
	}
	// https://datatracker.ietf.org/doc/rfc9106/
	// salt, 16 bytes is RECOMMENDED for password hashing
	// The Argon2id variant with t=3 and 64 MiB memory is the SECOND RECOMMENDED option
	// Argon2id with t=1 iteration, p=4 lanes, m=2 GiB of RAM, 128-bit salt, and 256-bit tag size.
	// Argon2id with t=3 iterations, p=4 lanes, m=64 MiB of RAM, 128-bit salt, and 256-bit tag size.
	key := argon2.IDKey([]byte(password), salt, 3, 64*1024, 4, 32)
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

func (s *Sign) DecodeFromHex(hexData string) ([]byte, error) {
	ciphertext, err := hex.DecodeString(hexData)
	if err != nil {
		return nil, err
	}
	return s.Decode(ciphertext)
}

func (s *Sign) EncodeToHex(plaintext []byte) (string, error) {
	ciphertext, err := s.Encode(plaintext)
	if err != nil {
		return "", err
	}
	text := hex.EncodeToString(ciphertext)
	return text, nil
}
