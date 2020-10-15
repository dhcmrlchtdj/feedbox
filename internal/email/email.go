package email

import (
	"bytes"
	"net/http"

	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/multipart"
)

type Client struct {
	urlPrefix string
	from      string
	apiKey    string
	client    *http.Client
}

func New(domain string, apiKey string, from string) *Client {
	return &Client{
		urlPrefix: "https://api.mailgun.net/v3/" + domain,
		from:      from,
		apiKey:    apiKey,
		client:    &http.Client{},
	}
}

func (c *Client) Send(addr string, subject string, text string) error {
	payload := new(bytes.Buffer)
	m := multipart.New(payload).
		Str("from", c.from).
		Str("to", addr).
		Str("subject", subject).
		Str("text", text).
		Str("html", text).
		Str("o:dkim", "yes")
	if err := m.Close(); err != nil {
		return err
	}

	req, err := http.NewRequest("POST", c.urlPrefix+"/messages", payload)
	if err != nil {
		return err
	}
	req.SetBasicAuth("api", c.apiKey)
	req.Header.Set("content-type", m.ContentType)
	resp, err := c.client.Do(req)
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
