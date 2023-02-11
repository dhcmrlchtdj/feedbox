package telegram

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"

	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/multipart"
)

var _ Client = (*httpClient)(nil)

type httpClient struct {
	name  string
	token string
}

func NewHTTPClient(name string, token string) *httpClient {
	return &httpClient{name: name, token: token}
}

///

func (c *httpClient) GetBotName(ctx context.Context) string {
	return c.name
}

func (c *httpClient) GetChatMember(ctx context.Context, payload *GetChatMemberPayload) (*ChatMember, error) {
	body, err := c.rawSend(ctx, "getChatMember", payload)
	if err != nil {
		return nil, err
	}
	defer body.Close()

	var resp struct {
		Result *ChatMember `json:"result"`
		Response
	}
	if err := DecodeResponse(body, &resp); err != nil {
		return nil, errors.Wrap(err, "telegram/getChatMember")
	}

	return resp.Result, nil
}

func (c *httpClient) SetWebhook(ctx context.Context, payload *SetWebhookPayload) error {
	return c.rawSendSimple(ctx, "setWebhook", payload)
}

func (c *httpClient) SetMyCommands(ctx context.Context, payload *SetMyCommandsPayload) error {
	return c.rawSendSimple(ctx, "setMyCommands", payload)
}

func (c *httpClient) SendMessage(ctx context.Context, payload *SendMessagePayload) error {
	return c.rawSendSimple(ctx, "sendMessage", payload)
}

func (c *httpClient) SendDocument(ctx context.Context, payload *SendDocumentPayload) error {
	r, w := io.Pipe()
	m := multipart.New(w)
	go func() {
		m.
			Int64("chat_id", payload.ChatID).
			File("document", payload.Document.Name, payload.Document.Content).
			Str("caption", payload.Caption).
			Str("parse_mode", payload.ParseMode).
			Int64("reply_to_message_id", payload.ReplyToMessageID)
		err := m.Close()
		_ = w.CloseWithError(err)
	}()
	return c.rawSendFileSimple(ctx, "sendDocument", m.ContentType, r)
}

///

// caller MUST close response.Body.
func (c *httpClient) rawSend(ctx context.Context, cmd string, payload any) (io.ReadCloser, error) {
	url := "https://api.telegram.org/bot" + c.token + "/" + cmd

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(payload); err != nil {
		return nil, errors.Wrap(err, "telegram/"+cmd)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, &buf)
	if err != nil {
		return nil, errors.Wrap(err, "telegram/"+cmd)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, errors.Wrap(err, "telegram/"+cmd)
	}

	if resp.StatusCode == 429 {
		defer resp.Body.Close()
		err429 := new(ErrTooManyRequests)
		err := json.NewDecoder(resp.Body).Decode(err429)
		if err == nil {
			err = err429
		}
		return nil, errors.Wrap(err, "telegram/"+cmd)
	}

	return resp.Body, nil
}

func (c *httpClient) rawSendSimple(ctx context.Context, cmd string, payload any) error {
	body, err := c.rawSend(ctx, cmd, payload)
	if err != nil {
		return err
	}
	defer body.Close()

	if err := DecodeResponse(body, new(Response)); err != nil {
		return errors.Wrap(err, "telegram/"+cmd)
	}

	return nil
}

func (c *httpClient) rawSendFileSimple(ctx context.Context, cmd string, contentType string, payload io.Reader) error {
	url := "https://api.telegram.org/bot" + c.token + "/" + cmd

	req, err := http.NewRequestWithContext(ctx, "POST", url, payload)
	if err != nil {
		return errors.Wrap(err, "telegram/"+cmd)
	}
	req.Header.Set("Content-Type", contentType)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return errors.Wrap(err, "telegram/"+cmd)
	}
	defer resp.Body.Close()

	if err := DecodeResponse(resp.Body, new(Response)); err != nil {
		return errors.Wrap(err, "telegram/"+cmd)
	}

	return nil
}

///

func DecodeResponse(body io.Reader, t interface{ Check() error }) error {
	if err := json.NewDecoder(body).Decode(t); err != nil {
		return err
	}
	return t.Check()
}
