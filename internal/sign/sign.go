package sign

import (
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"

	"github.com/pkg/errors"
	"golang.org/x/crypto/argon2"
	"golang.org/x/crypto/chacha20poly1305"
)

var _ Client = (*sign)(nil)

type sign struct {
	aead cipher.AEAD
}

func New(hexSecret string) (*sign, error) {
	key, err := hex.DecodeString(hexSecret)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	aead, err := chacha20poly1305.NewX(key)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return &sign{aead}, nil
}

func (s *sign) Encode(plaintext []byte) ([]byte, error) {
	nonce := make([]byte, s.aead.NonceSize(), s.aead.NonceSize()+len(plaintext)+s.aead.Overhead())
	if _, err := rand.Read(nonce); err != nil {
		return nil, errors.WithStack(err)
	}
	ciphertext := s.aead.Seal(nonce, nonce, plaintext, nil)
	return ciphertext, nil
}

func (s *sign) Decode(data []byte) ([]byte, error) {
	nonce, ciphertext := data[:s.aead.NonceSize()], data[s.aead.NonceSize():]
	plaintext, err := s.aead.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return plaintext, nil
}

func (s *sign) DecodeFromHex(hexData string) ([]byte, error) {
	ciphertext, err := hex.DecodeString(hexData)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return s.Decode(ciphertext)
}

func (s *sign) EncodeToHex(plaintext []byte) (string, error) {
	ciphertext, err := s.Encode(plaintext)
	if err != nil {
		return "", errors.WithStack(err)
	}
	text := hex.EncodeToString(ciphertext)
	return text, nil
}

func NewWithPassword(password string) (*sign, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return nil, errors.WithStack(err)
	}
	// https://datatracker.ietf.org/doc/rfc9106/
	// salt, 16 bytes is RECOMMENDED for password hashing
	// The Argon2id variant with t=3 and 64 MiB memory is the SECOND RECOMMENDED option
	// Argon2id with t=1 iteration, p=4 lanes, m=2 GiB of RAM, 128-bit salt, and 256-bit tag size.
	// Argon2id with t=3 iterations, p=4 lanes, m=64 MiB of RAM, 128-bit salt, and 256-bit tag size.
	key := argon2.IDKey([]byte(password), salt, 3, 64*1024, 4, 32)
	aead, err := chacha20poly1305.NewX(key)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return &sign{aead}, nil
}
