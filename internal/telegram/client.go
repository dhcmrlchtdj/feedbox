package telegram

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/multipart"
)

var C *Client = nil

type Client struct {
	Name  string
	token string
}

func New(name string, token string) *Client {
	return &Client{Name: strings.ToLower(name), token: token}
}

///

func (c *Client) GetChatMember(payload *GetChatMemberPayload) (*ChatMember, error) {
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

func (c *Client) SetWebhook(payload *SetWebhookPayload) error {
	return c.rawSendSimple("setWebhook", payload)
}

func (c *Client) SetMyCommands(payload *SetMyCommandsPayload) error {
	return c.rawSendSimple("setMyCommands", payload)
}

func (c *Client) SendMessage(payload *SendMessagePayload) error {
	return c.rawSendSimple("sendMessage", payload)
}

func (c *Client) SendAudio(payload *SendAudioPayload) error {
	return c.rawSendSimple("sendAudio", payload)
}

func (c *Client) SendDocument(payload *SendDocumentPayload) error {
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
		_ = w.CloseWithError(err) // _ == err
	}()
	return c.rawSendFileSimple("sendDocument", m.ContentType, r)
}

///

// caller MUST close response.Body
func (c *Client) rawSend(cmd string, payload interface{}) (io.ReadCloser, error) {
	url := "https://api.telegram.org/bot" + c.token + "/" + cmd

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(payload); err != nil {
		return nil, errors.Wrap(err, "telegram/"+cmd)
	}

	resp, err := http.Post(url, "application/json", &buf) //nolint:bodyclose
	if err != nil {
		return nil, errors.Wrap(err, "telegram/"+cmd)
	}

	return resp.Body, nil
}

func (c *Client) rawSendSimple(cmd string, payload interface{}) error {
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

func (c *Client) rawSendFileSimple(cmd string, contentType string, payload io.Reader) error {
	url := "https://api.telegram.org/bot" + c.token + "/" + cmd
	resp, err := http.Post(url, contentType, payload)
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
