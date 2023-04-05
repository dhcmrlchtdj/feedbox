package email

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"

	"github.com/pkg/errors"
)

var _ Client = (*mailchannels)(nil)

type mailchannels struct {
	client    *http.Client
	workerUrl string
	username  string
	password  string
	fromAddr  mcAddress
}

func NewMailChannels(workerUrl string, username string, password string, fromAddr string, fromName string) *mailchannels {
	return &mailchannels{
		client:    new(http.Client),
		workerUrl: workerUrl,
		username:  username,
		password:  password,
		fromAddr: mcAddress{
			Email: fromAddr,
			Name:  fromName,
		},
	}
}

func (c *mailchannels) buildSendPayload(addr string, subject string, text string) mcPayload {
	payload := mcPayload{
		Subject: subject,
		Content: []mcContent{
			{Type: "text/plain", Value: text},
			{Type: "text/html", Value: text},
		},
		From: c.fromAddr,
		Personalizations: []mcPersonalization{
			{To: []mcAddress{{Email: addr}}},
		},
	}
	return payload
}

func (c *mailchannels) Send(ctx context.Context, addr string, subject string, text string) error {
	payload, err := json.Marshal(c.buildSendPayload(addr, subject, text))
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		c.workerUrl,
		bytes.NewBuffer(payload),
	)
	if err != nil {
		return err
	}
	req.SetBasicAuth(c.username, c.password)
	req.Header.Set("content-type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 202 {
		return errors.Errorf("mailchannels return '%v'", resp.Status)
	}

	return nil
}

type mcAddress struct {
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

type mcContent struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

type mcPersonalization struct {
	To []mcAddress `json:"to"`
	// Cc             []mcAddress       `json:"cc,omitempty"`
	// Bcc            []mcAddress       `json:"bcc,omitempty"`
	// DkimDomain     string            `json:"Dkim_domain,omitempty"`
	// DkimPrivateKey string            `json:"Dkim_private_key,omitempty"`
	// DkimSelector   string            `json:"Dkim_selector,omitempty"`
	// From           *mcAddress        `json:"from,omitempty"`
	// Headers        map[string]string `json:"headers,omitempty"`
	// ReplyTo        *mcAddress        `json:"reply_to,omitempty"`
	// Subject        string            `json:"subject,omitempty"`
}

type mcPayload struct {
	Subject          string              `json:"subject"`
	Content          []mcContent         `json:"content"`
	From             mcAddress           `json:"from"`
	Personalizations []mcPersonalization `json:"personalizations"`
	// Headers          map[string]string   `json:"headers,omitempty"`
	// ReplyTo          *mcAddress          `json:"reply_to,omitempty"`
}
