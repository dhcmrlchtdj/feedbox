package email

type Client interface {
	Send(addr string, subject string, text string) error
}
