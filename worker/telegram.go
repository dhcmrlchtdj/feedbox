package worker

import (
	"context"
	"encoding/json/v2"
	"errors"
	"html"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/mmcdole/gofeed"
	"github.com/rs/zerolog"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
)

func buildTelegramPayload(to string, feed *database.Feed, item *gofeed.Item) (string, error) {
	chatID, err := strconv.ParseInt(to, 10, 64)
	if err != nil {
		return "", err
	}
	text := buildTelegramContent(feed.URL, item)
	payload := telegram.SendMessagePayload{
		ChatID:    chatID,
		Text:      text,
		ParseMode: telegram.ParseModeHTML,
	}
	b, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func buildTelegramContent(feedURL string, item *gofeed.Item) string {
	if isLobsters(feedURL) {
		return buildTelegramContentForLobsters(item)
	} else {
		return buildTelegramContentForCommon(item)
	}
}

func buildTelegramContentForCommon(item *gofeed.Item) string {
	var text strings.Builder
	text.WriteString(html.EscapeString(item.Title))
	text.WriteString("\n\n")
	text.WriteString(html.EscapeString(item.Link))
	if len(item.Categories) > 0 {
		text.WriteString("\n\n")
		for _, tag := range item.Categories {
			text.WriteByte('#')
			text.WriteString(html.EscapeString(strings.TrimSpace(tag)))
			text.WriteByte(' ')
		}
	}
	return text.String()
}

func isLobsters(url string) bool {
	return url == "https://lobste.rs/rss"
}

func buildTelegramContentForLobsters(item *gofeed.Item) string {
	var text strings.Builder
	text.WriteString(html.EscapeString(item.Link))
	if len(item.Categories) > 0 {
		text.WriteString("\n\n")
		for _, tag := range item.Categories {
			text.WriteByte('#')
			text.WriteString(html.EscapeString(strings.TrimSpace(tag)))
			text.WriteByte(' ')
		}
	}
	if comment, ok := item.Custom["comments"]; ok {
		text.WriteString("\n\n")
		text.WriteString("comment: ")
		text.WriteString(html.EscapeString(comment))
	}
	return text.String()
}

func telegramSendMsg(ctx context.Context, msg *telegram.SendMessagePayload) error {
	logger := zerolog.Ctx(ctx)

	retry := 1
	for retry > 0 {
		retry--

		err := telegram.SendMessage(ctx, msg)
		if err != nil {
			var err429 *telegram.TooManyRequestsError
			if errors.As(err, &err429) {
				maxSleep := math.Min(err429.Parameters.RetryAfter, 120)
				time.Sleep(time.Second * time.Duration(maxSleep))
				continue
			}

			var errResp *telegram.Response
			if errors.As(err, &errResp) {
				if *errResp.ErrorCode == 403 {
					logger.Warn().Str("module", "worker").Stack().Err(err).Send()
					return nil
				}
			}

			return err
		}
		return nil
	}
	return nil
}

func handleTelegramTask(ctx context.Context, task *database.Task) error {
	var msg telegram.SendMessagePayload
	if err := json.Unmarshal([]byte(task.Payload), &msg); err != nil {
		return err
	}
	return telegramSendMsg(ctx, &msg)
}
