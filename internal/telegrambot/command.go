package telegrambot

import (
	"bytes"
	"strconv"
	"strings"

	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/global"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
	"github.com/dhcmrlchtdj/feedbox/internal/util"
)

func executeCommand(cmd string, arg string, msg *telegram.Message) {
	var err error
	switch cmd {
	case "/list":
		err = list(arg, msg)
	case "/add":
		err = add(arg, msg)
	case "/remove":
		err = remove(arg, msg)
	case "/remove_all":
		err = removeAll(arg, msg)
	case "/export":
		err = export(arg, msg)
	default:
		err = errors.Errorf("unknown command: '%v'", cmd)
	}
	if err != nil {
		global.Monitor.Error(err)
		e := global.TG.SendMessage(&telegram.SendMessagePayload{
			ChatID:           msg.Chat.ID,
			Text:             err.Error(),
			ReplyToMessageID: msg.MessageID,
		})
		if e != nil {
			global.Monitor.Error(e)
		}
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
	feedID, err := global.DB.GetFeedIDByURL(arg)
	if err != nil {
		return err
	}
	if err := global.DB.Subscribe(user.ID, feedID); err != nil {
		return err
	}

	return global.TG.SendMessage(&telegram.SendMessagePayload{
		ChatID:           msg.Chat.ID,
		Text:             "added",
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
	feedID, err := global.DB.GetFeedIDByURL(arg)
	if err != nil {
		return err
	}
	if err := global.DB.Unsubscribe(user.ID, feedID); err != nil {
		return err
	}

	return global.TG.SendMessage(&telegram.SendMessagePayload{
		ChatID:           msg.Chat.ID,
		Text:             "removed",
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
	if len(feeds) == 0 {
		return errors.New("feed list is empty")
	}

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
	if len(feeds) == 0 {
		return errors.New("feed list is empty")
	}

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
