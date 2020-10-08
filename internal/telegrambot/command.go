package telegrambot

import (
	"bytes"
	"fmt"
	"strconv"
	"strings"

	"github.com/dhcmrlchtdj/feedbox/internal/global"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
	"github.com/dhcmrlchtdj/feedbox/internal/util"
)

func executeCommand(cmd string, arg string, msg *telegram.Message) error {
	switch cmd {
	case "/list":
		return list(arg, msg)
	case "/add":
		return add(arg, msg)
	case "/remove":
		return remove(arg, msg)
	case "/remove_all":
		return removeAll(arg, msg)
	case "/export":
		return export(arg, msg)
	default:
		return fmt.Errorf("unknown command: %v", cmd)
	}
}

func list(arg string, msg *telegram.Message) error {
	if !isAdmin(msg) {
		return nil
	}

	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := global.DB.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}
	feeds, err := global.DB.GetFeedByUser(user.ID)
	if err != nil {
		return err
	}

	var builder strings.Builder
	for i, feed := range feeds {
		if i > 0 {
			builder.WriteByte('\n')
		}
		builder.WriteString(feed.URL)
	}
	text := builder.String()
	if len(text) == 0 {
		text = "feed list is empty"
	}

	return global.TG.SendMessage(&telegram.SendMessagePayload{
		ChatID:           msg.Chat.ID,
		Text:             text,
		ReplyToMessageID: msg.MessageID,
	})
}

func add(arg string, msg *telegram.Message) error {
	if !isAdmin(msg) {
		return nil
	}

	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := global.DB.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}

	var text string
	if util.IsValidURL(arg) {
		feedID, err := global.DB.GetFeedIDByURL(arg)
		if err == nil {
			err = global.DB.Subscribe(user.ID, feedID)
		}
		if err == nil {
			text = "added"
		} else {
			text = err.Error()
		}
	} else {
		text = fmt.Sprintf("not a valid url: '%v'", arg)
	}

	return global.TG.SendMessage(&telegram.SendMessagePayload{
		ChatID:           msg.Chat.ID,
		Text:             text,
		ReplyToMessageID: msg.MessageID,
	})
}

func remove(arg string, msg *telegram.Message) error {
	if !isAdmin(msg) {
		return nil
	}

	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := global.DB.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}

	var text string
	if util.IsValidURL(arg) {
		feedID, err := global.DB.GetFeedIDByURL(arg)
		if err == nil {
			err = global.DB.Unsubscribe(user.ID, feedID)
		}
		if err == nil {
			text = "removed"
		} else {
			text = err.Error()
		}
	} else {
		text = fmt.Sprintf("not a valid url: '%v'", arg)
	}

	return global.TG.SendMessage(&telegram.SendMessagePayload{
		ChatID:           msg.Chat.ID,
		Text:             text,
		ReplyToMessageID: msg.MessageID,
	})
}

func removeAll(arg string, msg *telegram.Message) error {
	if !isAdmin(msg) {
		return nil
	}

	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := global.DB.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}
	feeds, err := global.DB.GetFeedByUser(user.ID)
	if err != nil {
		return err
	}
	if err := global.DB.UnsubscribeAll(user.ID); err != nil {
		return err
	}

	if len(feeds) > 0 {
		opml := util.BuildOPMLFromFeed(feeds)
		return global.TG.SendDocument(&telegram.SendDocumentPayload{
			ChatID:           msg.Chat.ID,
			ReplyToMessageID: msg.MessageID,
			Caption:          "done",
			Document: telegram.InputFile{
				Name:    "feeds.opml",
				Content: bytes.NewReader(opml),
			},
		})
	}
	return global.TG.SendMessage(&telegram.SendMessagePayload{
		ChatID:           msg.Chat.ID,
		Text:             "feed list is empty",
		ReplyToMessageID: msg.MessageID,
	})
}

func export(arg string, msg *telegram.Message) error {
	if !isAdmin(msg) {
		return nil
	}

	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := global.DB.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}
	feeds, err := global.DB.GetFeedByUser(user.ID)
	if err != nil {
		return err
	}

	if len(feeds) > 0 {
		opml := util.BuildOPMLFromFeed(feeds)
		return global.TG.SendDocument(&telegram.SendDocumentPayload{
			ChatID:           msg.Chat.ID,
			ReplyToMessageID: msg.MessageID,
			Caption:          "done",
			Document: telegram.InputFile{
				Name:    "feeds.opml",
				Content: bytes.NewReader(opml),
			},
		})
	}
	return global.TG.SendMessage(&telegram.SendMessagePayload{
		ChatID:           msg.Chat.ID,
		Text:             "feed list is empty",
		ReplyToMessageID: msg.MessageID,
	})
}

///

func isAdmin(msg *telegram.Message) bool {
	chatType := msg.Chat.Type
	if chatType == "group" || chatType == "supergroup" {
		member, err := global.TG.GetChatMember(
			&telegram.GetChatMemberPayload{
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
