package email

import (
	"context"
	"os"
	"sync"

	"github.com/mailgun/mailgun-go/v4"
)

type MailgunClient struct {
	MG   mailgun.Mailgun
	From string
}

var (
	Client *MailgunClient
	once   sync.Once
)

func Init() {
	once.Do(func() {
		Client = &MailgunClient{
			MG:   mailgun.NewMailgun(os.Getenv("MAILGUN_DOMAIN"), os.Getenv("MAILGUN_API_KEY")),
			From: os.Getenv("MAILGUN_FROM"),
		}
	})
}

func (client *MailgunClient) Send(addr string, subject string, text string) error {
	message := client.MG.NewMessage(client.From, subject, text, addr)
	_, _, err := client.MG.Send(context.Background(), message)
	return err
}
