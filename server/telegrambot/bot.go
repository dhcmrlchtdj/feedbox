package telegrambot

import (
	"fmt"
	"os"
	"strings"
	"unicode/utf16"

	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
)

func RegisterWebhook() error {
	// curl -XPOST -v 'https://api.telegram.org/bot<<token>>/setWebhook' -H 'content-type: application/json' -d '{"url":"<<url>>"}'
	err := telegram.C.SetWebhook(
		telegram.SetWebhookPayload{
			URL: fmt.Sprintf("%s/webhook/telegram/%s",
				os.Getenv("SERVER"),
				os.Getenv("TELEGRAM_WEBHOOK_PATH")),
		})
	if err != nil {
		return err
	}

	err = telegram.C.SetMyCommands(
		telegram.SetMyCommandsPayload{
			Commands: []telegram.BotCommand{
				{Command: "list", Description: "list all feeds"},
				{Command: "add", Description: "[url] subscribe feed"},
				{Command: "twitter", Description: "[username] subscribe twitter via nitter"},
				{Command: "twitter_media", Description: "[username] subscribe twitter via nitter"},
				{Command: "remove", Description: "[url] unsubscribe feed"},
				{Command: "remove_all", Description: "unsubscribe all"},
				{Command: "export", Description: "export feed list as OPML"},
				{Command: "import", Description: "import OPML (reply to OPML file)"},
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
		if entity.Type != "bot_command" {
			continue
		}
		text := utf16.Encode([]rune(message.Text))
		cmd := string(utf16.Decode(text[entity.Offset:entity.Length]))
		if i := strings.Index(cmd, "@"); i != -1 {
			name := cmd[i+1:]
			cmd = cmd[:i]
			if !strings.EqualFold(name, telegram.C.Name) {
				break
			}
		}
		arg := string(utf16.Decode(text[entity.Offset+entity.Length:]))
		arg = strings.TrimSpace(arg)
		executeCommand(cmd, arg, message)
		break
	}
}
