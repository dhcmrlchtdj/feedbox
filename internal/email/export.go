package email

var C client

type client interface {
	Send(addr string, subject string, text string) error
}
