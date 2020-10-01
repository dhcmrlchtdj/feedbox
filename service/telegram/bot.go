package telegram

import (
	"os"
	"strings"
	"unicode/utf16"

	"github.com/dhcmrlchtdj/feedbox/service/monitor"
)

func RegisterWebhook() error {
	err := Client.SetWebhook(
		&SetWebhookPayload{
			URL: os.Getenv("SERVER") + "/webhook/telegram/" + os.Getenv("TELEGRAM_WEBHOOK_PATH"),
		})
	if err != nil {
		return err
	}

	err = Client.SetMyCommands(
		&SetMyCommandsPayload{
			Commands: []BotCommand{
				{"list", "list all feeds"},
				{"add", "[url] subscribe url"},
				{"remove", "[url] unsubscribe url"},
				{"remove_all", "unsubscribe all"},
				{"export", "export feed list as OPML"},
			},
		})
	if err != nil {
		return err
	}

	return nil
}

func HandleWebhook(payload *Update) {
	handleMessage(payload.Message)
	handleMessage(payload.EditedMessage)
	handleMessage(payload.ChannelPost)
	handleMessage(payload.EditedChannelPost)
}

func handleMessage(message *Message) {
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
				if name != os.Getenv("TELEGRAM_BOT_NAME") {
					continue
				}
			}
			arg := string(utf16.Decode(text[entity.Offset+entity.Length:]))
			arg = strings.TrimSpace(arg)
			if err := executeCommand(cmd, arg, message); err != nil {
				monitor.Client.Error(err)
			}
			return
		}
	}
}
