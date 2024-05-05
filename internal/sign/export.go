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

func init() {
	var dryrun Client
	dryrun, err := NewWithPassword("dryrun")
	if err != nil {
		panic(err)
	}
	defaultImpl.Store(&dryrun)
}

func Default() Client {
	return *defaultImpl.Load()
}

func SetDefault(c Client) {
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
