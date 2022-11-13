package telegrambot

import (
	"github.com/dhcmrlchtdj/feedbox/internal/global"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
)

func isAdmin(msg *telegram.Message) bool {
	chatType := msg.Chat.Type
	if chatType == "group" || chatType == "supergroup" {
		member, err := global.Telegram.GetChatMember(
			telegram.GetChatMemberPayload{
				ChatID: msg.Chat.ID,
				UserID: msg.From.ID,
			})
		if err != nil {
			return false
		}
		return member.Status == "creator" || member.Status == "administrator"
	}
	return true
}
