package telegram

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"sync"

	"github.com/pkg/errors"
)

type TGClient struct {
	token string
}

var (
	Client = &TGClient{}
	once   sync.Once
)

func Init() {
	once.Do(func() {
		Client.token = os.Getenv("TELEGRAM_BOT_TOKEN")
	})
}

func (c *TGClient) GetChatMember(payload *GetChatMemberPayload) (*ChatMember, error) {
	body, err := Client.rawSend("getChatMember", payload)
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

func (c *TGClient) SetWebhook(payload *SetWebhookPayload) error {
	return c.RawSendSimple("setWebhook", payload)
}

func (c *TGClient) SetMyCommands(payload *SetMyCommandsPayload) error {
	return c.RawSendSimple("setMyCommands", payload)
}

func (c *TGClient) SendMessage(payload *SendMessagePayload) error {
	return c.RawSendSimple("sendMessage", payload)
}

func (c *TGClient) SendAudio(payload *SendAudioPayload) error {
	return c.RawSendSimple("sendAudio", payload)
}

func (c *TGClient) SendDocument(payload *SendDocumentPayload) error {
	r, w := io.Pipe()
	writer := multipart.NewWriter(w)
	go func() {
		defer w.Close()
		if err := writeFile(writer, "document", payload.Document); err != nil {
			w.CloseWithError(err)
		}
		if err := writeInt64(writer, "chat_id", payload.ChatID); err != nil {
			w.CloseWithError(err)
		}
		if err := writeString(writer, "caption", payload.Caption); err != nil {
			w.CloseWithError(err)
		}
		if err := writeString(writer, "parse_mode", payload.ParseMode); err != nil {
			w.CloseWithError(err)
		}
		if err := writeInt64(writer, "reply_to_message_id", payload.ReplyToMessageID); err != nil {
			w.CloseWithError(err)
		}
		if err := writer.Close(); err != nil {
			w.CloseWithError(err)
		}
	}()
	return c.RawSendFileSimple("sendDocument", writer.FormDataContentType(), r)
}

///

func (c *TGClient) rawSend(cmd string, payload interface{}) (io.ReadCloser, error) {
	url := "https://api.telegram.org/bot" + c.token + "/" + cmd

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(payload); err != nil {
		return nil, errors.Wrap(err, "telegram/"+cmd)
	}

	resp, err := http.Post(url, "application/json", &buf)
	if err != nil {
		if resp != nil {
			resp.Body.Close()
		}
		return nil, errors.Wrap(err, "telegram/"+cmd)
	}
	return resp.Body, nil
}

func (c *TGClient) RawSendSimple(cmd string, payload interface{}) error {
	body, err := c.rawSend(cmd, payload)
	if err != nil {
		return err
	}
	defer body.Close()

	if err := DecodeResponse(body, &Response{}); err != nil {
		return errors.Wrap(err, "telegram/"+cmd)
	}

	return nil
}

func (c *TGClient) RawSendFileSimple(cmd string, contentType string, payload io.Reader) error {
	url := "https://api.telegram.org/bot" + c.token + "/" + cmd
	resp, err := http.Post(url, contentType, payload)
	if resp != nil {
		defer resp.Body.Close()
	}
	if err != nil {
		return errors.Wrap(err, "telegram/"+cmd)
	}
	if err := DecodeResponse(resp.Body, &Response{}); err != nil {
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

///

func writeString(writer *multipart.Writer, fieldName string, field string) error {
	if field != "" {
		err := writer.WriteField(fieldName, field)
		if err != nil {
			return err
		}
	}
	return nil
}

func writeInt64(writer *multipart.Writer, fieldName string, field int64) error {
	if field != 0 {
		err := writer.WriteField(fieldName, int64ToString(field))
		if err != nil {
			return err
		}
	}
	return nil
}

func writeFile(writer *multipart.Writer, fieldName string, file InputFile) error {
	part, err := writer.CreateFormFile(fieldName, file.Name)
	if err != nil {
		return err
	}
	if _, err := io.Copy(part, file.Content); err != nil {
		return err
	}
	return nil
}
