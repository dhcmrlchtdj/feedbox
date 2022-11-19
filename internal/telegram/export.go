package telegram

import "context"

type Client interface {
	GetBotName(ctx context.Context) string
	GetChatMember(ctx context.Context, payload *GetChatMemberPayload) (*ChatMember, error)
	SetWebhook(ctx context.Context, payload *SetWebhookPayload) error
	SetMyCommands(ctx context.Context, payload *SetMyCommandsPayload) error
	SendMessage(ctx context.Context, payload *SendMessagePayload) error
	SendDocument(ctx context.Context, payload *SendDocumentPayload) error
}
