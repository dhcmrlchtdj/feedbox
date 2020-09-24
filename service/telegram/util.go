package telegram

import (
	"net/url"
	"strconv"
)

func int64ToString(x int64) string {
	return strconv.FormatInt(x, 10)
}

func isAdmin(msg *Message) bool {
	chatType := msg.Chat.Type
	if chatType == "group" || chatType == "supergroup" {
		member, err := Client.GetChatMember(
			&GetChatMemberPayload{
				ChatID: msg.Chat.ID,
				UserID: msg.From.ID,
			})
		if err != nil {
			return false
		}
		return member.Status == "creator" || member.Status == "administrator"
	} else {
		return true
	}
}

func isValidURL(link string) bool {
	u, err := url.Parse(link)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return false
	}
	return true
}
