package telegram

import (
	"context"
	"sync/atomic"
)

type Client interface {
	GetBotName(ctx context.Context) string
	GetChatMember(ctx context.Context, payload *GetChatMemberPayload) (*ChatMember, error)
	SetWebhook(ctx context.Context, payload *SetWebhookPayload) error
	SetMyCommands(ctx context.Context, payload *SetMyCommandsPayload) error
	SendMessage(ctx context.Context, payload *SendMessagePayload) error
	SendDocument(ctx context.Context, payload *SendDocumentPayload) error
}

///

var defaultImpl atomic.Pointer[Client]

func init() {
	var dryrun Client = NewDryRun()
	defaultImpl.Store(&dryrun)
}

func Default() Client {
	return *defaultImpl.Load()
}

func SetDefault(c Client) {
	defaultImpl.Store(&c)
}

///

func GetBotName(ctx context.Context) string {
	return Default().GetBotName(ctx)
}

func GetChatMember(ctx context.Context, payload *GetChatMemberPayload) (*ChatMember, error) {
	return Default().GetChatMember(ctx, payload)
}

func SetWebhook(ctx context.Context, payload *SetWebhookPayload) error {
	return Default().SetWebhook(ctx, payload)
}

func SetMyCommands(ctx context.Context, payload *SetMyCommandsPayload) error {
	return Default().SetMyCommands(ctx, payload)
}

func SendMessage(ctx context.Context, payload *SendMessagePayload) error {
	return Default().SendMessage(ctx, payload)
}

func SendDocument(ctx context.Context, payload *SendDocumentPayload) error {
	return Default().SendDocument(ctx, payload)
}
