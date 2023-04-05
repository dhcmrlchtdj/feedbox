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
}

type mailchannelsPayload struct {
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	Content string   `json:"content"`
}

func NewMailChannels(workerUrl string, username string, password string) *mailchannels {
	return &mailchannels{
		client:    new(http.Client),
		workerUrl: workerUrl,
		username:  username,
		password:  password,
	}
}

func (c *mailchannels) Send(ctx context.Context, addr string, subject string, text string) error {
	payload, err := json.Marshal(mailchannelsPayload{
		To:      []string{addr},
		Subject: subject,
		Content: text,
	})
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

	if resp.StatusCode >= 300 {
		e := errors.New(resp.Status)
		return errors.Wrap(e, "mailchannels failure")
	}

	return nil
}
