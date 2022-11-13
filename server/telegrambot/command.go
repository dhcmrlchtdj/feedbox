package telegrambot

import (
	"bytes"
	"strconv"
	"strings"

	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/global"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
	"github.com/dhcmrlchtdj/feedbox/internal/util"
)

var (
	ErrUnknownCommand = errors.New("unknown command")
	ErrEmptyList      = errors.New("feed list is empty")
	ErrInvalidTwitter = errors.New("invalid twitter username")
)

func executeCommand(cmd string, arg string, msg *telegram.Message) {
	if !isAdmin(msg) {
		return
	}

	var err error
	switch cmd {
	case "/start":
		err = start(msg)
	case "/list":
		err = list(msg)
	case "/add":
		err = add(arg, msg)
	case "/remove":
		err = remove(arg, msg)
	case "/remove_all":
		err = removeAll(msg)
	case "/export":
		err = export(msg)
	case "/import":
		err = importOPML(msg)
	default:
		err = errors.Wrap(ErrUnknownCommand, cmd)
	}

	if err == nil {
		return
	} else if errors.Is(err, ErrUnknownCommand) {
		log.Warn().Str("module", "telegrambot").Stack().Err(err).Send()
	} else if errors.Is(err, database.ErrInvalidURL) ||
		errors.Is(err, ErrEmptyList) ||
		errors.Is(err, ErrInvalidTwitter) {
		text := err.Error()
		if err := global.Telegram.SendMessage(telegram.SendMessagePayload{
			ChatID: msg.Chat.ID,
			Text:   text,
		}); err != nil {
			log.Error().Str("module", "telegrambot").Stack().Err(err).Send()
		}
	} else {
		log.Error().Str("module", "telegrambot").Stack().Err(err).Send()
	}
}

///

func start(msg *telegram.Message) error {
	return global.Telegram.SendMessage(telegram.SendMessagePayload{
		ChatID:    msg.Chat.ID,
		Text:      "<code>hello, world</code>",
		ParseMode: telegram.ParseModeHTML,
	})
}

func list(msg *telegram.Message) error {
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := global.Database.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}
	feeds, err := global.Database.GetFeedByUser(user.ID, "url")
	if err != nil {
		return err
	}
	if len(feeds) == 0 {
		return ErrEmptyList
	}

	var builder strings.Builder
	for i, feed := range feeds {
		if i > 0 {
			builder.WriteString("\n\n")
		}
		builder.WriteString(feed.URL)
	}
	text := builder.String()

	return global.Telegram.SendMessage(telegram.SendMessagePayload{
		ChatID: msg.Chat.ID,
		Text:   text,
	})
}

func add(arg string, msg *telegram.Message) error {
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := global.Database.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}
	feedID, err := global.Database.GetFeedIDByURL(arg)
	if err != nil {
		return err
	}
	if err := global.Database.Subscribe(user.ID, feedID); err != nil {
		return err
	}

	return global.Telegram.SendMessage(telegram.SendMessagePayload{
		ChatID: msg.Chat.ID,
		Text:   "added",
	})
}

func remove(arg string, msg *telegram.Message) error {
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := global.Database.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}
	feedID, err := global.Database.GetFeedIDByURL(arg)
	if err != nil {
		return err
	}
	if err := global.Database.Unsubscribe(user.ID, feedID); err != nil {
		return err
	}

	return global.Telegram.SendMessage(telegram.SendMessagePayload{
		ChatID: msg.Chat.ID,
		Text:   "removed",
	})
}

func removeAll(msg *telegram.Message) error {
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := global.Database.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}
	feeds, err := global.Database.GetFeedByUser(user.ID, "url")
	if err != nil {
		return err
	}
	if len(feeds) == 0 {
		return ErrEmptyList
	}
	if err := global.Database.UnsubscribeAll(user.ID); err != nil {
		return err
	}

	opml := util.BuildOPMLFromFeed(feeds)
	return global.Telegram.SendDocument(telegram.SendDocumentPayload{
		ChatID:  msg.Chat.ID,
		Caption: "removed",
		Document: telegram.InputFile{
			Name:    "feeds.opml",
			Content: bytes.NewReader(opml),
		},
	})
}

func export(msg *telegram.Message) error {
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := global.Database.GetOrCreateUserByTelegram(chatID)
	if err != nil {
		return err
	}
	feeds, err := global.Database.GetFeedByUser(user.ID, "url")
	if err != nil {
		return err
	}
	if len(feeds) == 0 {
		return ErrEmptyList
	}

	opml := util.BuildOPMLFromFeed(feeds)
	return global.Telegram.SendDocument(telegram.SendDocumentPayload{
		ChatID: msg.Chat.ID,
		Document: telegram.InputFile{
			Name:    "feeds.opml",
			Content: bytes.NewReader(opml),
		},
	})
}

func importOPML(msg *telegram.Message) error {
	// TODO: unused
	return nil
}
