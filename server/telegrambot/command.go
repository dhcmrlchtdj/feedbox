package telegrambot

import (
	"bytes"
	"context"
	"strconv"
	"strings"

	"github.com/pkg/errors"
	"github.com/rs/zerolog"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
	"github.com/dhcmrlchtdj/feedbox/internal/util"
)

var (
	ErrUnknownCommand = errors.New("unknown command")
	ErrEmptyList      = errors.New("empty list")
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
		err = importOPML(ctx, msg)
	case "/set_commands":
		err = setCommands(ctx, msg)
	default:
		err = errors.Wrap(ErrUnknownCommand, cmd)
	}

	logger := zerolog.Ctx(ctx)
	if err == nil {
		return
	} else if errors.Is(err, ErrUnknownCommand) {
		logger.Warn().Str("module", "telegrambot").Stack().Err(err).Send()
	} else if errors.Is(err, database.ErrInvalidURL) ||
		errors.Is(err, ErrEmptyList) {
		err = telegram.SendMessage(
			ctx,
			&telegram.SendMessagePayload{
				ChatID: msg.Chat.ID,
				Text:   err.Error(),
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
	return telegram.SendMessage(
		ctx,
		&telegram.SendMessagePayload{
			ChatID:    msg.Chat.ID,
			Text:      "<code>hello, world</code>",
			ParseMode: telegram.ParseModeHTML,
		},
	)
}

func list(ctx context.Context, msg *telegram.Message) error {
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := database.GetOrCreateUserByTelegram(ctx, chatID)
	if err != nil {
		return err
	}
	feeds, err := database.GetFeedByUser(ctx, user.ID, "url")
	if err != nil {
		return err
	}
	if len(feeds) == 0 {
		return errors.WithStack(ErrEmptyList)
	}

	var builder strings.Builder
	for i, feed := range feeds {
		if i > 0 {
			builder.WriteString("\n\n")
		}
		builder.WriteString(feed.URL)
		if feed.Err != "" {
			builder.WriteString("\n")
			builder.WriteString(feed.Err)
			builder.WriteString(" @ ")
			builder.WriteString(feed.ErrAt.UTC().Format("2006-01-02 15:04:05"))
			builder.WriteString("\n")
		}
	}
	text := builder.String()

	return telegram.SendMessage(
		ctx,
		&telegram.SendMessagePayload{
			ChatID: msg.Chat.ID,
			Text:   text,
		},
	)
}

func add(ctx context.Context, arg string, msg *telegram.Message) error {
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := database.GetOrCreateUserByTelegram(ctx, chatID)
	if err != nil {
		return err
	}
	feedID, err := database.GetFeedIDByURL(ctx, arg)
	if err != nil {
		return err
	}
	if err := database.Subscribe(ctx, user.ID, feedID); err != nil {
		return err
	}

	return telegram.SendMessage(
		ctx,
		&telegram.SendMessagePayload{
			ChatID: msg.Chat.ID,
			Text:   "added",
		},
	)
}

func remove(ctx context.Context, arg string, msg *telegram.Message) error {
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := database.GetOrCreateUserByTelegram(ctx, chatID)
	if err != nil {
		return err
	}
	feedID, err := database.GetFeedIDByURL(ctx, arg)
	if err != nil {
		return err
	}
	if err := database.Unsubscribe(ctx, user.ID, feedID); err != nil {
		return err
	}

	return telegram.SendMessage(
		ctx,
		&telegram.SendMessagePayload{
			ChatID: msg.Chat.ID,
			Text:   "removed",
		},
	)
}

func removeAll(ctx context.Context, msg *telegram.Message) error {
	chatID := strconv.FormatInt(msg.Chat.ID, 10)
	user, err := database.GetOrCreateUserByTelegram(ctx, chatID)
	if err != nil {
		return err
	}
	feeds, err := database.GetFeedByUser(ctx, user.ID, "url")
	if err != nil {
		return err
	}
	if len(feeds) == 0 {
		return errors.WithStack(ErrEmptyList)
	}
	if err := database.UnsubscribeAll(ctx, user.ID); err != nil {
		return err
	}

	opml := util.BuildOPMLFromFeed(feeds)
	return telegram.SendDocument(
		ctx,
		&telegram.SendDocumentPayload{
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
	user, err := database.GetOrCreateUserByTelegram(ctx, chatID)
	if err != nil {
		return err
	}
	feeds, err := database.GetFeedByUser(ctx, user.ID, "url")
	if err != nil {
		return err
	}
	if len(feeds) == 0 {
		return errors.WithStack(ErrEmptyList)
	}

	opml := util.BuildOPMLFromFeed(feeds)
	return telegram.SendDocument(
		ctx,
		&telegram.SendDocumentPayload{
			ChatID: msg.Chat.ID,
			Document: telegram.InputFile{
				Name:    "feeds.opml",
				Content: bytes.NewReader(opml),
			},
		},
	)
}

func importOPML(_ context.Context, _ *telegram.Message) error {
	// TODO: unused
	return nil
}

func setCommands(ctx context.Context, msg *telegram.Message) error {
	if msg.Chat.Type != "private" {
		return nil
	}

	err := telegram.SetMyCommands(
		ctx,
		&telegram.SetMyCommandsPayload{
			Commands: []telegram.BotCommand{
				{Command: "list", Description: "List all feeds"},
				{Command: "add", Description: "[url] Subscribe feed"},
				{Command: "remove", Description: "[url] Unsubscribe feed"},
				{Command: "remove_all", Description: "Unsubscribe all"},
				{Command: "export", Description: "Export feed list as OPML"},
				// {Command: "import", Description: "Import OPML (reply to OPML file)"},
			},
		})
	return err
}
