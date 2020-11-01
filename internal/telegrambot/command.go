package telegrambot

import (
	"bytes"
	"strconv"
	"strings"

	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/monitor"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
	"github.com/dhcmrlchtdj/feedbox/internal/util"
)

var (
	ErrCmdUnknown   = errors.New("unknown command")
	ErrCmdEmptyList = errors.New("feed list is empty")
)

func executeCommand(cmd string, arg string, msg *telegram.Message) {
	if !isAdmin(msg) {
		return
	}

	var err error
	switch cmd {
	case "/start":
		err = start(arg, msg)
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
		err = ErrCmdUnknown
	}

	if err != nil {
		if errors.Is(err, database.ErrInvalidURL) ||
			errors.Is(err, ErrCmdUnknown) ||
			errors.Is(err, ErrCmdEmptyList) {
			text := err.Error()
			err = telegram.C.SendMessage(&telegram.SendMessagePayload{
				ChatID:           msg.Chat.ID,
				Text:             text,
				ReplyToMessageID: msg.MessageID,
			})
		}
		if err != nil {
			monitor.C.Error(err)
		}
	}
}

func start(arg string, msg *telegram.Message) error {
	return telegram.C.SendMessage(&telegram.SendMessagePayload{
		ChatID:           msg.Chat.ID,
		Text:             "<code>hello, world</code>",
		ParseMode:        telegram.ParseModeHTML,
		ReplyToMessageID: msg.MessageID,
	})
}

func list(arg string, msg *telegram.Message) error {
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := database.C.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}
	feeds, err := database.C.GetFeedByUser(user.ID)
	if err != nil {
		return err
	}
	if len(feeds) == 0 {
		return ErrCmdEmptyList
	}

	var builder strings.Builder
	for i, feed := range feeds {
		if i > 0 {
			builder.WriteByte('\n')
		}
		builder.WriteString(feed.URL)
	}
	text := builder.String()

	return telegram.C.SendMessage(&telegram.SendMessagePayload{
		ChatID:           msg.Chat.ID,
		Text:             text,
		ReplyToMessageID: msg.MessageID,
	})
}

func add(arg string, msg *telegram.Message) error {
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := database.C.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}
	feedID, err := database.C.GetFeedIDByURL(arg)
	if err != nil {
		return err
	}
	if err := database.C.Subscribe(user.ID, feedID); err != nil {
		return err
	}

	return telegram.C.SendMessage(&telegram.SendMessagePayload{
		ChatID:           msg.Chat.ID,
		Text:             "added",
		ReplyToMessageID: msg.MessageID,
	})
}

func remove(arg string, msg *telegram.Message) error {
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := database.C.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}
	feedID, err := database.C.GetFeedIDByURL(arg)
	if err != nil {
		return err
	}
	if err := database.C.Unsubscribe(user.ID, feedID); err != nil {
		return err
	}

	return telegram.C.SendMessage(&telegram.SendMessagePayload{
		ChatID:           msg.Chat.ID,
		Text:             "removed",
		ReplyToMessageID: msg.MessageID,
	})
}

func removeAll(arg string, msg *telegram.Message) error {
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := database.C.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}
	feeds, err := database.C.GetFeedByUser(user.ID)
	if err != nil {
		return err
	}
	if len(feeds) == 0 {
		return ErrCmdEmptyList
	}
	if err := database.C.UnsubscribeAll(user.ID); err != nil {
		return err
	}

	opml := util.BuildOPMLFromFeed(feeds)
	return telegram.C.SendDocument(&telegram.SendDocumentPayload{
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
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := database.C.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}
	feeds, err := database.C.GetFeedByUser(user.ID)
	if err != nil {
		return err
	}
	if len(feeds) == 0 {
		return ErrCmdEmptyList
	}

	opml := util.BuildOPMLFromFeed(feeds)
	return telegram.C.SendDocument(&telegram.SendDocumentPayload{
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
		member, err := telegram.C.GetChatMember(
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
