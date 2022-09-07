package telegram

import "github.com/rs/zerolog/log"

var _ client = (*dryRun)(nil)

type dryRun struct{}

func NewDryRun() *dryRun {
	return &dryRun{}
}

///

func (*dryRun) GetBotName() string {
	return ""
}

func (*dryRun) GetChatMember(payload GetChatMemberPayload) (*ChatMember, error) {
	log.Debug().
		Str("module", "telegram").
		Str("method", "GetChatMember").
		Send()
	return nil, nil
}

func (*dryRun) SetWebhook(payload SetWebhookPayload) error {
	log.Debug().
		Str("module", "telegram").
		Str("method", "SetWebhook").
		Send()
	return nil
}

func (*dryRun) SetMyCommands(payload SetMyCommandsPayload) error {
	log.Debug().
		Str("module", "telegram").
		Str("method", "SetMyCommands").
		Send()
	return nil
}

func (*dryRun) SendMessage(payload SendMessagePayload) error {
	log.Debug().
		Str("module", "telegram").
		Str("method", "SendMessage").
		Send()
	return nil
}

func (*dryRun) SendDocument(payload SendDocumentPayload) error {
	log.Debug().
		Str("module", "telegram").
		Str("method", "SendDocument").
		Send()
	return nil
}
