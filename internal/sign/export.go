package sign

type Client interface {
	Encode(plaintext []byte) ([]byte, error)
	Decode(data []byte) ([]byte, error)
	DecodeFromHex(hexData string) ([]byte, error)
	EncodeToHex(plaintext []byte) (string, error)
}
