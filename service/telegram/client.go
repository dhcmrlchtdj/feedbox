package telegram

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"mime/multipart"
	"net/http"
	"os"
	"sync"

	"github.com/pkg/errors"
)

type TelegramClient struct {
	token string
}

var (
	Client = &TelegramClient{}
	once   sync.Once
)

func Init() {
	once.Do(func() {
		Client.token = os.Getenv("TELEGRAM_BOT_TOKEN")
	})
}

func (c *TelegramClient) GetChatMember(payload *GetChatMemberPayload) (*ChatMember, error) {
	body, err := Client.RawSend("getChatMember", payload)
	if err != nil {
		return nil, err
	}

	var resp struct {
		Result *ChatMember `json:"result"`
		Response
	}
	if err := DecodeResponse(body, &resp); err != nil {
		return nil, err
	}

	return resp.Result, nil
}

func (c *TelegramClient) SetWebhook(payload *SetWebhookPayload) error {
	return c.RawSendSimple("setWebhook", payload)
}

func (c *TelegramClient) SetMyCommands(payload *SetMyCommandsPayload) error {
	return c.RawSendSimple("setMyCommands", payload)
}

func (c *TelegramClient) SendMessage(payload *SendMessagePayload) error {
	return c.RawSendSimple("sendMessage", payload)
}

func (c *TelegramClient) SendDocument(payload *SendDocumentPayload) error {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	part, err := writer.CreateFormFile("document", payload.Document.Name)
	if err != nil {
		return err
	}
	if _, err = part.Write(payload.Document.Buffer); err != nil {
		return err
	}

	if err := writer.WriteField("chat_id", int64ToString(payload.ChatID)); err != nil {
		return err
	}
	if payload.Caption != "" {
		if err := writer.WriteField("caption", payload.Caption); err != nil {
			return err
		}
	}
	if payload.ParseMode != "" {
		if err := writer.WriteField("parse_mode", payload.ParseMode); err != nil {
			return err
		}
	}
	if payload.ReplyToMessageID != 0 {
		if err := writer.WriteField("reply_to_message_id", int64ToString(payload.ReplyToMessageID)); err != nil {
			return err
		}
	}
	if err := writer.Close(); err != nil {
		return err
	}

	url := "https://api.telegram.org/bot" + c.token + "/sendDocument"
	resp, err := http.Post(url, writer.FormDataContentType(), &buf)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	return DecodeResponse(body, &Response{})
}

///

func (client *TelegramClient) RawSend(cmd string, payload interface{}) ([]byte, error) {
	url := "https://api.telegram.org/bot" + client.token + "/" + cmd

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(payload); err != nil {
		return nil, errors.Wrap(err, "telegram/"+cmd)
	}

	resp, err := http.Post(url, "application/json", &buf)
	if err != nil {
		return nil, errors.Wrap(err, "telegram/"+cmd)
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, errors.Wrap(err, "telegram/"+cmd)
	}
	return body, nil
}

func (client *TelegramClient) RawSendSimple(cmd string, payload interface{}) error {
	body, err := client.RawSend(cmd, payload)
	if err != nil {
		return errors.Wrap(err, "telegram/"+cmd)
	}

	var resp Response
	if err := DecodeResponse(body, &resp); err != nil {
		return errors.Wrap(err, "telegram/"+cmd)
	}

	return nil
}

func DecodeResponse(body []byte, t interface{ Check() error }) error {
	if err := json.Unmarshal(body, &t); err != nil {
		return err
	}
	return t.Check()
}
