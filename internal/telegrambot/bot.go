package telegrambot

import (
	"fmt"
	"os"
	"strings"
	"unicode/utf16"

	"github.com/dhcmrlchtdj/feedbox/internal/global"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
)

func RegisterWebhook() error {
	// curl -XPOST -v 'https://api.telegram.org/bot<<token>>/setWebhook' -H 'content-type: application/json' -d '{"url":"<<url>>"}'
	err := global.TG.SetWebhook(
		&telegram.SetWebhookPayload{
			URL: fmt.Sprintf("%s/webhook/telegram/%s",
				os.Getenv("SERVER"),
				os.Getenv("TELEGRAM_WEBHOOK_PATH")),
		})
	if err != nil {
		return err
	}

	err = global.TG.SetMyCommands(
		&telegram.SetMyCommandsPayload{
			Commands: []telegram.BotCommand{
				{Command: "list", Description: "list all feeds"},
				{Command: "add", Description: "[url] subscribe url"},
				{Command: "remove", Description: "[url] unsubscribe url"},
				{Command: "remove_all", Description: "unsubscribe all"},
				{Command: "export", Description: "export feed list as OPML"},
			},
		})
	if err != nil {
		return err
	}

	return nil
}

func HandleWebhook(payload *telegram.Update) {
	handleMessage(payload.Message)
	handleMessage(payload.EditedMessage)
	handleMessage(payload.ChannelPost)
	handleMessage(payload.EditedChannelPost)
}

func handleMessage(message *telegram.Message) {
	if message == nil {
		return
	}
	for _, entity := range message.Entities {
		if entity.Type == "bot_command" {
			text := utf16.Encode([]rune(message.Text))
			cmd := string(utf16.Decode(text[entity.Offset:entity.Length]))
			if i := strings.Index(cmd, "@"); i != -1 {
				name := cmd[i+1:]
				cmd = cmd[:i]
				if strings.ToLower(name) != global.TG.Name {
					continue
				}
			}
			arg := string(utf16.Decode(text[entity.Offset+entity.Length:]))
			arg = strings.TrimSpace(arg)
			executeCommand(cmd, arg, message)
		}
	}
}
