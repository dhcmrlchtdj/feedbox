package telegram

var C client

type client interface {
	GetBotName() string
	GetChatMember(payload GetChatMemberPayload) (*ChatMember, error)
	SetWebhook(payload SetWebhookPayload) error
	SetMyCommands(payload SetMyCommandsPayload) error
	SendMessage(payload SendMessagePayload) error
	SendDocument(payload SendDocumentPayload) error
}
