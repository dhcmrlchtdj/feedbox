package telegram

import (
	"context"

	"github.com/rs/zerolog"
)

var _ Client = (*dryRun)(nil)

type dryRun struct{}

func NewDryRun() *dryRun {
	return &dryRun{}
}

///

func (*dryRun) GetBotName(ctx context.Context) string {
	return ""
}

func (*dryRun) GetChatMember(ctx context.Context, payload GetChatMemberPayload) (*ChatMember, error) {
	zerolog.Ctx(ctx).Debug().
		Str("module", "telegram").
		Str("method", "GetChatMember").
		Send()
	return nil, nil
}

func (*dryRun) SetWebhook(ctx context.Context, payload SetWebhookPayload) error {
	zerolog.Ctx(ctx).Debug().
		Str("module", "telegram").
		Str("method", "SetWebhook").
		Send()
	return nil
}

func (*dryRun) SetMyCommands(ctx context.Context, payload SetMyCommandsPayload) error {
	zerolog.Ctx(ctx).Debug().
		Str("module", "telegram").
		Str("method", "SetMyCommands").
		Send()
	return nil
}

func (*dryRun) SendMessage(ctx context.Context, payload SendMessagePayload) error {
	zerolog.Ctx(ctx).Debug().
		Str("module", "telegram").
		Str("method", "SendMessage").
		Send()
	return nil
}

func (*dryRun) SendDocument(ctx context.Context, payload SendDocumentPayload) error {
	zerolog.Ctx(ctx).Debug().
		Str("module", "telegram").
		Str("method", "SendDocument").
		Send()
	return nil
}
