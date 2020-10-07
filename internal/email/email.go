package email

import (
	"context"

	"github.com/mailgun/mailgun-go/v4"
)

type Client struct {
	MG   mailgun.Mailgun
	From string
}

func New(domain string, apiKey string, from string) *Client {
	return &Client{
		MG:   mailgun.NewMailgun(domain, apiKey),
		From: from,
	}
}

func (c *Client) Send(addr string, subject string, text string) error {
	message := c.MG.NewMessage(c.From, subject, text, addr)
	message.SetHtml(text)
	_, _, err := c.MG.Send(context.Background(), message)
	return err
}
