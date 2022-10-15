package telegram

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"

	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/multipart"
)

var _ client = (*httpClient)(nil)

type httpClient struct {
	name  string
	token string
}

func NewHttpClient(name string, token string) *httpClient {
	return &httpClient{name: name, token: token}
}

///

func (c *httpClient) GetBotName() string {
	return c.name
}

func (c *httpClient) GetChatMember(payload GetChatMemberPayload) (*ChatMember, error) {
	body, err := c.rawSend("getChatMember", payload)
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

func (c *httpClient) SetWebhook(payload SetWebhookPayload) error {
	return c.rawSendSimple("setWebhook", payload)
}

func (c *httpClient) SetMyCommands(payload SetMyCommandsPayload) error {
	return c.rawSendSimple("setMyCommands", payload)
}

func (c *httpClient) SendMessage(payload SendMessagePayload) error {
	return c.rawSendSimple("sendMessage", payload)
}

func (c *httpClient) SendDocument(payload SendDocumentPayload) error {
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
	return c.rawSendFileSimple("sendDocument", m.ContentType, r)
}

///

// caller MUST close response.Body
func (c *httpClient) rawSend(cmd string, payload any) (io.ReadCloser, error) {
	url := "https://api.telegram.org/bot" + c.token + "/" + cmd

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(payload); err != nil {
		return nil, errors.Wrap(err, "telegram/"+cmd)
	}

	resp, err := http.Post(url, "application/json", &buf) //nolint:gosec
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

func (c *httpClient) rawSendSimple(cmd string, payload any) error {
	body, err := c.rawSend(cmd, payload)
	if err != nil {
		return err
	}
	defer body.Close()

	if err := DecodeResponse(body, new(Response)); err != nil {
		return errors.Wrap(err, "telegram/"+cmd)
	}

	return nil
}

func (c *httpClient) rawSendFileSimple(cmd string, contentType string, payload io.Reader) error {
	url := "https://api.telegram.org/bot" + c.token + "/" + cmd
	resp, err := http.Post(url, contentType, payload) //nolint:gosec
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
