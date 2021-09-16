package worker

import (
	"strings"
	"sync"
	"time"

	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/monitor"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
)

// we should support template for different source
// but I'm too lazy to implement it
func isLobsters(tgItem telegramItem) bool {
	return tgItem.feed.URL == "https://lobste.rs/rss"
}

func telegramSendMsg(msg telegram.SendMessagePayload, rl *RateLimiter) {
	retry := 1
	for {
		rl.Wait()
		err := telegram.C.SendMessage(msg)
		if err != nil {
			var err429 *telegram.ErrTooManyRequests
			if errors.As(err, &err429) {
				time.Sleep(time.Second * time.Duration(err429.Parameters.RetryAfter))
				if retry > 0 {
					retry--
					continue
				}
			}
			monitor.C.Error(err)
		}
		return
	}
}

func sendTelegram(done *sync.WaitGroup, qTelegram <-chan telegramItem) {
	// https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this
	rateLimiter := NewRateLimiter(20, time.Second)

	worker := func(x telegramItem) {
		if len(x.users) == 0 {
			return
		}

		item := x.item
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
		if isLobsters(x) {
			if comment, ok := item.Custom["comments"]; ok {
				text.WriteString("\n\n")
				text.WriteString("comment: ")
				text.WriteString(comment)
			}
		}
		content := text.String()

		for _, user := range x.users {
			payload := telegram.SendMessagePayload{
				ChatID: user,
				Text:   content,
			}
			telegramSendMsg(payload, rateLimiter)
		}
	}

	go func() {
		defer done.Done()

		for item := range qTelegram {
			worker(item)
		}
	}()
}
