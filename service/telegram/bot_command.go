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

	var text strings.Builder
	for i, feed := range feeds {
		if i > 0 {
			text.WriteByte('\n')
		}
		text.WriteString(feed.URL)
	}

	return Client.SendMessage(&SendMessagePayload{
		ChatID:           msg.Chat.ID,
		Text:             text.String(),
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

	text := "Usage: /add [url]"
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

	text := "Usage: /remove [url]"
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
				Name:   "feeds.opml",
				Buffer: opml,
			},
		})
	} else {
		return Client.SendMessage(&SendMessagePayload{
			ChatID:           msg.Chat.ID,
			Text:             "the feed list is empty",
			ReplyToMessageID: msg.MessageID,
		})
	}
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
				Name:   "feeds.opml",
				Buffer: opml,
			},
		})
	} else {
		return Client.SendMessage(&SendMessagePayload{
			ChatID:           msg.Chat.ID,
			Text:             "the feed list is empty",
			ReplyToMessageID: msg.MessageID,
		})
	}
}
