package sign

import "sync/atomic"

type Client interface {
	Encode(plaintext []byte) ([]byte, error)
	Decode(data []byte) ([]byte, error)
	DecodeFromHex(hexData string) ([]byte, error)
	EncodeToHex(plaintext []byte) (string, error)
}

///

var defaultImpl atomic.Pointer[Client]

func Default() Client {
	return *defaultImpl.Load()
}

func Init(c Client) {
	defaultImpl.Store(&c)
}

///

func Encode(plaintext []byte) ([]byte, error) {
	return Default().Encode(plaintext)
}

func Decode(data []byte) ([]byte, error) {
	return Default().Decode(data)
}

func DecodeFromHex(hexData string) ([]byte, error) {
	return Default().DecodeFromHex(hexData)
}

func EncodeToHex(plaintext []byte) (string, error) {
	return Default().EncodeToHex(plaintext)
}
