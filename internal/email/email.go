package email

import (
	"bytes"
	"net/http"

	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/multipart"
)

type Client struct {
	URLPrefix string
	From      string
	APIKey    string
	Client    *http.Client
}

func New(domain string, apiKey string, from string) *Client {
	return &Client{
		URLPrefix: "https://api.mailgun.net/v3/" + domain,
		From:      from,
		APIKey:    apiKey,
		Client:    &http.Client{},
	}
}

func (c *Client) Send(addr string, subject string, text string) error {
	payload := new(bytes.Buffer)
	m := multipart.New(payload).
		Str("form", c.From).
		Str("to", addr).
		Str("subject", subject).
		Str("text", text).
		Str("html", text)
	if err := m.Close(); err != nil {
		return err
	}

	req, err := http.NewRequest("POST", c.URLPrefix+"/message", payload)
	if err != nil {
		return err
	}
	req.SetBasicAuth("api", c.APIKey)
	req.Header.Set("content-type", m.ContentType)
	resp, err := c.Client.Do(req)
	if resp != nil {
		defer resp.Body.Close()
	}
	if err != nil {
		return err
	}

	if resp.StatusCode != 200 {
		return errors.Errorf("email: %s", resp.Status)
	}

	return nil
}
