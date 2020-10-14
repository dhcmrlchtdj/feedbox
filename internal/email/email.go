package email

import (
	"bytes"
	"io"
	"io/ioutil"
	"mime/multipart"
	"net/http"
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
	payload := &bytes.Buffer{}
	writer := multipart.NewWriter(payload)
	if err := writer.WriteField("from", c.From); err != nil {
		return err
	}
	if err := writer.WriteField("to", addr); err != nil {
		return err
	}
	if err := writer.WriteField("subject", subject); err != nil {
		return err
	}
	if err := writer.WriteField("text", text); err != nil {
		return err
	}
	if err := writer.WriteField("html", text); err != nil {
		return err
	}
	if err := writer.Close(); err != nil {
		return err
	}
	req, err := http.NewRequest("POST", c.URLPrefix+"/message", payload)
	if err != nil {
		return err
	}
	req.SetBasicAuth("api", c.APIKey)
	req.Header.Set("content-type", writer.FormDataContentType())
	resp, err := c.Client.Do(req)
	if err != nil {
		return err
	}
	if resp != nil {
		io.Copy(ioutil.Discard, resp.Body)
		resp.Body.Close()
	}
	return nil
}
