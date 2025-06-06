package worker

import (
	"context"
	"errors"
	"html"
	"math"
	"strings"
	"sync"
	"time"

	"github.com/mmcdole/gofeed"
	"github.com/rs/zerolog"

	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
)

func telegramSendMsg(ctx context.Context, msg *telegram.SendMessagePayload, rl *RateLimiter) {
	logger := zerolog.Ctx(ctx)

	retry := 1
	for retry > 0 {
		retry--

		rl.Wait()
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
					return
				}
			}

			logger.Error().Str("module", "worker").Stack().Err(err).Send()
		}
		return
	}
}

func sendTelegram(ctx context.Context, done *sync.WaitGroup, qTelegram <-chan telegramItem) {
	// https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this
	rateLimiter := NewRateLimiter(20, time.Second)

	worker := func(x telegramItem) {
		if len(x.users) == 0 {
			return
		}

		content := buildContent(&x)

		for _, user := range x.users {
			payload := telegram.SendMessagePayload{
				ChatID:    user,
				Text:      content,
				ParseMode: "HTML",
			}
			telegramSendMsg(ctx, &payload, rateLimiter)
		}
	}

	done.Add(1)
	go func() {
		defer done.Done()

		for item := range qTelegram {
			worker(item)
		}
	}()
}

func buildContent(tgItem *telegramItem) string {
	if isLobsters(tgItem.feed.URL) {
		return buildContentForLobsters(tgItem.item)
	} else {
		return buildContentForCommon(tgItem.item, false)
	}
}

func buildContentForCommon(item *gofeed.Item, withTitle bool) string {
	var text strings.Builder
	text.WriteString(item.Link)
	if len(item.Categories) > 0 {
		text.WriteString("\n\n")
		for _, tag := range item.Categories {
			text.WriteByte('#')
			text.WriteString(strings.TrimSpace(tag))
			text.WriteByte(' ')
		}
	}
	if withTitle {
		text.WriteString(html.EscapeString(item.Title))
	}
	return html.EscapeString(text.String())
}

func isLobsters(url string) bool {
	return url == "https://lobste.rs/rss"
}

func buildContentForLobsters(item *gofeed.Item) string {
	var text strings.Builder
	text.WriteString(item.Link)
	if len(item.Categories) > 0 {
		text.WriteString("\n\n")
		for _, tag := range item.Categories {
			text.WriteByte('#')
			text.WriteString(strings.TrimSpace(tag))
			text.WriteByte(' ')
		}
	}
	if comment, ok := item.Custom["comments"]; ok {
		text.WriteString("\n\n")
		text.WriteString("comment: ")
		text.WriteString(comment)
	}
	return html.EscapeString(text.String())
}
