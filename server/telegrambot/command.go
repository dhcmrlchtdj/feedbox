package telegrambot

import (
	"bytes"
	"context"
	"strconv"
	"strings"

	"github.com/pkg/errors"
	"github.com/rs/zerolog"

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

func executeCommand(ctx context.Context, cmd string, arg string, msg *telegram.Message) {
	if !isAdmin(ctx, msg) {
		return
	}

	var err error
	switch cmd {
	case "/start":
		err = start(ctx, msg)
	case "/list":
		err = list(ctx, msg)
	case "/add":
		err = add(ctx, arg, msg)
	case "/remove":
		err = remove(ctx, arg, msg)
	case "/remove_all":
		err = removeAll(ctx, msg)
	case "/export":
		err = export(ctx, msg)
	case "/import":
		err = importOPML(msg)
	default:
		err = errors.Wrap(ErrUnknownCommand, cmd)
	}

	logger := zerolog.Ctx(ctx)
	if err == nil {
		return
	} else if errors.Is(err, ErrUnknownCommand) {
		logger.Warn().Str("module", "telegrambot").Stack().Err(err).Send()
	} else if errors.Is(err, database.ErrInvalidURL) ||
		errors.Is(err, ErrEmptyList) ||
		errors.Is(err, ErrInvalidTwitter) {
		text := err.Error()
		err := global.Telegram.SendMessage(
			ctx,
			telegram.SendMessagePayload{
				ChatID: msg.Chat.ID,
				Text:   text,
			})
		if err != nil {
			logger.Error().Str("module", "telegrambot").Stack().Err(err).Send()
		}
	} else {
		logger.Error().Str("module", "telegrambot").Stack().Err(err).Send()
	}
}

///

func start(ctx context.Context, msg *telegram.Message) error {
	return global.Telegram.SendMessage(
		ctx,
		telegram.SendMessagePayload{
			ChatID:    msg.Chat.ID,
			Text:      "<code>hello, world</code>",
			ParseMode: telegram.ParseModeHTML,
		},
	)
}

func list(ctx context.Context, msg *telegram.Message) error {
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := global.Database.GetOrCreateUserByTelegram(ctx, chatID)
	if err != nil {
		return err
	}
	feeds, err := global.Database.GetFeedByUser(ctx, user.ID, "url")
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

	return global.Telegram.SendMessage(
		ctx,
		telegram.SendMessagePayload{
			ChatID: msg.Chat.ID,
			Text:   text,
		},
	)
}

func add(ctx context.Context, arg string, msg *telegram.Message) error {
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := global.Database.GetOrCreateUserByTelegram(ctx, chatID)
	if err != nil {
		return err
	}
	feedID, err := global.Database.GetFeedIDByURL(ctx, arg)
	if err != nil {
		return err
	}
	if err := global.Database.Subscribe(ctx, user.ID, feedID); err != nil {
		return err
	}

	return global.Telegram.SendMessage(
		ctx,
		telegram.SendMessagePayload{
			ChatID: msg.Chat.ID,
			Text:   "added",
		},
	)
}

func remove(ctx context.Context, arg string, msg *telegram.Message) error {
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := global.Database.GetOrCreateUserByTelegram(ctx, chatID)
	if err != nil {
		return err
	}
	feedID, err := global.Database.GetFeedIDByURL(ctx, arg)
	if err != nil {
		return err
	}
	if err := global.Database.Unsubscribe(ctx, user.ID, feedID); err != nil {
		return err
	}

	return global.Telegram.SendMessage(
		ctx,
		telegram.SendMessagePayload{
			ChatID: msg.Chat.ID,
			Text:   "removed",
		},
	)
}

func removeAll(ctx context.Context, msg *telegram.Message) error {
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := global.Database.GetOrCreateUserByTelegram(ctx, chatID)
	if err != nil {
		return err
	}
	feeds, err := global.Database.GetFeedByUser(ctx, user.ID, "url")
	if err != nil {
		return err
	}
	if len(feeds) == 0 {
		return ErrEmptyList
	}
	if err := global.Database.UnsubscribeAll(ctx, user.ID); err != nil {
		return err
	}

	opml := util.BuildOPMLFromFeed(feeds)
	return global.Telegram.SendDocument(
		ctx,
		telegram.SendDocumentPayload{
			ChatID:  msg.Chat.ID,
			Caption: "removed",
			Document: telegram.InputFile{
				Name:    "feeds.opml",
				Content: bytes.NewReader(opml),
			},
		},
	)
}

func export(ctx context.Context, msg *telegram.Message) error {
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := global.Database.GetOrCreateUserByTelegram(ctx, chatID)
	if err != nil {
		return err
	}
	feeds, err := global.Database.GetFeedByUser(ctx, user.ID, "url")
	if err != nil {
		return err
	}
	if len(feeds) == 0 {
		return ErrEmptyList
	}

	opml := util.BuildOPMLFromFeed(feeds)
	return global.Telegram.SendDocument(
		ctx,
		telegram.SendDocumentPayload{
			ChatID: msg.Chat.ID,
			Document: telegram.InputFile{
				Name:    "feeds.opml",
				Content: bytes.NewReader(opml),
			},
		},
	)
}

func importOPML(msg *telegram.Message) error {
	// TODO: unused
	return nil
}
