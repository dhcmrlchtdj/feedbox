package telegram

import (
	"fmt"
	"strings"

	db "github.com/dhcmrlchtdj/feedbox/database"
	"github.com/dhcmrlchtdj/feedbox/util"
)

func executeCommand(cmd string, arg string, msg *Message) error {
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

func list(arg string, msg *Message) error {
	if !isAdmin(msg) {
		return nil
	}

	chatID := int64ToString(msg.Chat.ID)
	user, err := db.Client.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}
	feeds, err := db.Client.GetFeedByUser(user.ID)
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

	return Client.SendMessage(&SendMessagePayload{
		ChatID:           msg.Chat.ID,
		Text:             text,
		ReplyToMessageID: msg.MessageID,
	})
}

func add(arg string, msg *Message) error {
	if !isAdmin(msg) {
		return nil
	}

	chatID := int64ToString(msg.Chat.ID)
	user, err := db.Client.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}

	var text string
	if isValidURL(arg) {
		feedID, err := db.Client.GetFeedIDByURL(arg)
		if err == nil {
			err = db.Client.Subscribe(user.ID, feedID)
		}
		if err == nil {
			text = "added"
		} else {
			text = err.Error()
		}
	} else {
		text = fmt.Sprintf("not a valid url: '%v'", arg)
	}

	return Client.SendMessage(&SendMessagePayload{
		ChatID:           msg.Chat.ID,
		Text:             text,
		ReplyToMessageID: msg.MessageID,
	})
}

func remove(arg string, msg *Message) error {
	if !isAdmin(msg) {
		return nil
	}

	chatID := int64ToString(msg.Chat.ID)
	user, err := db.Client.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}

	var text string
	if isValidURL(arg) {
		feedID, err := db.Client.GetFeedIDByURL(arg)
		if err == nil {
			err = db.Client.Unsubscribe(user.ID, feedID)
		}
		if err == nil {
			text = "removed"
		} else {
			text = err.Error()
		}
	} else {
		text = fmt.Sprintf("not a valid url: '%v'", arg)
	}

	return Client.SendMessage(&SendMessagePayload{
		ChatID:           msg.Chat.ID,
		Text:             text,
		ReplyToMessageID: msg.MessageID,
	})
}

func removeAll(arg string, msg *Message) error {
	if !isAdmin(msg) {
		return nil
	}

	chatID := int64ToString(msg.Chat.ID)
	user, err := db.Client.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}
	feeds, err := db.Client.GetFeedByUser(user.ID)
	if err != nil {
		return err
	}
	if err := db.Client.UnsubscribeAll(user.ID); err != nil {
		return err
	}

	if len(feeds) > 0 {
		opml := util.BuildOPMLFromFeed(feeds)
		return Client.SendDocument(&SendDocumentPayload{
			ChatID:           msg.Chat.ID,
			ReplyToMessageID: msg.MessageID,
			Caption:          "done",
			Document: InputFile{
				Name:    "feeds.opml",
				Content: opml,
			},
		})
	}
	return Client.SendMessage(&SendMessagePayload{
		ChatID:           msg.Chat.ID,
		Text:             "feed list is empty",
		ReplyToMessageID: msg.MessageID,
	})
}

func export(arg string, msg *Message) error {
	if !isAdmin(msg) {
		return nil
	}

	chatID := int64ToString(msg.Chat.ID)
	user, err := db.Client.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}
	feeds, err := db.Client.GetFeedByUser(user.ID)
	if err != nil {
		return err
	}

	if len(feeds) > 0 {
		opml := util.BuildOPMLFromFeed(feeds)
		return Client.SendDocument(&SendDocumentPayload{
			ChatID:           msg.Chat.ID,
			ReplyToMessageID: msg.MessageID,
			Caption:          "done",
			Document: InputFile{
				Name:    "feeds.opml",
				Content: opml,
			},
		})
	}
	return Client.SendMessage(&SendMessagePayload{
		ChatID:           msg.Chat.ID,
		Text:             "feed list is empty",
		ReplyToMessageID: msg.MessageID,
	})
}
