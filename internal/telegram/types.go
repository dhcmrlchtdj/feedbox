package telegram

import "io"

///

type Update struct {
	UpdatedID         int64          `json:"update_id"`
	Message           *Message       `json:"message,omitempty"`
	EditedMessage     *Message       `json:"edited_message,omitempty"`
	ChannelPost       *Message       `json:"channel_post,omitempty"`
	EditedChannelPost *Message       `json:"edited_channel_post,omitempty"`
	CallbackQuery     *CallbackQuery `json:"callback_query,omitempty"`
}

///

type User struct {
	ID           int64  `json:"id"`
	IsBot        bool   `json:"is_bot"`
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name,omitempty"`
	Username     string `json:"username,omitempty"`
	LanguageCode string `json:"language_code,omitempty"`
}

type Chat struct {
	ID   int64  `json:"id"`
	Type string `json:"type"`
}

type Message struct {
	MessageID      int64            `json:"message_id"`
	Date           int64            `json:"date"`
	Chat           *Chat            `json:"chat"`
	From           *User            `json:"from,omitempty"`
	ReplyToMessage *Message         `json:"reply_to_message,omitempty"`
	Text           string           `json:"text,omitempty"`
	Entities       []*MessageEntity `json:"entities,omitempty"`
}

type MessageEntity struct {
	Type     string `json:"type"`
	Offset   int64  `json:"offset"`
	Length   int64  `json:"length"`
	URL      string `json:"url,omitempty"`
	User     *User  `json:"user,omitempty"`
	Language string `json:"language,omitempty"`
}

type CallbackQuery struct {
	ID              string   `json:"id"`
	From            *User    `json:"from"`
	Message         *Message `json:"message,omitempty"`
	InlineMessageID string   `json:"inline_message_id,omitempty"`
	Data            string   `json:"data,omitempty"`
}

type BotCommand struct {
	Command     string `json:"command"`
	Description string `json:"description"`
}

type ChatMember struct {
	User   *User  `json:"user"`
	Status string `json:"status"`
}

///

type Response struct {
	Ok          bool   `json:"ok"`
	ErrorCode   *int   `json:"error_code,omitempty"`
	Description string `json:"description,omitempty"`
}

func (r *Response) Check() error {
	if !r.Ok {
		return r
	}
	return nil
}

func (e *Response) Error() string {
	return e.Description
}

///

type ErrTooManyRequests struct {
	Response
	Parameters struct {
		RetryAfter float64 `json:"retry_after"`
	} `json:"parameters"`
}

func (e *ErrTooManyRequests) Error() string {
	return e.Description
}

///

type GetChatMemberPayload struct {
	ChatID int64 `json:"chat_id"`
	UserID int64 `json:"user_id"`
}

type SetWebhookPayload struct {
	URL string `json:"url"`
}

type SetMyCommandsPayload struct {
	Commands []BotCommand `json:"commands"`
}

const (
	ParseModeHTML     = "HTML"
	ParseModeMarkdowm = "MarkdownV2"
)

type SendMessagePayload struct {
	ChatID           int64  `json:"chat_id"`
	Text             string `json:"text"`
	ParseMode        string `json:"parse_mode,omitempty"`
	ReplyToMessageID int64  `json:"reply_to_message_id,omitempty"`
}

type SendDocumentPayload struct {
	ChatID           int64
	Document         InputFile
	Caption          string
	ParseMode        string
	ReplyToMessageID int64
}

///

type InputFile struct {
	Name    string
	Content io.Reader
}
