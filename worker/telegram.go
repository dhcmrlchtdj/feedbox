package worker

import (
	"strings"
	"sync"
	"time"

	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/monitor"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
)

func telegramGenMsg(wg *sync.WaitGroup, qTelegram <-chan telegramItem) <-chan telegram.SendMessagePayload {
	msgs := make(chan telegram.SendMessagePayload)

	genMsg := func(tgItem telegramItem) {
		item := tgItem.item
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
		content := text.String()

		for _, user := range tgItem.users {
			payload := telegram.SendMessagePayload{
				ChatID: user,
				Text:   content,
			}
			msgs <- payload
		}
	}

	go func() {
		defer wg.Done()

		for item := range qTelegram {
			genMsg(item)
		}
		close(msgs)
	}()

	return msgs
}

func telegramSendMsg(msgs <-chan telegram.SendMessagePayload) {
	// https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this
	rateLimiter := NewRateLimiter(20, time.Second)

	for msg := range msgs {
		msg := msg // XXX: make linter happy
		retry := 1
		for {
			rateLimiter.Wait()
			err := telegram.C.SendMessage(&msg)
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
			break
		}
	}
}

func sendTelegram(done *sync.WaitGroup, qTelegram <-chan telegramItem) {
	go func() {
		defer done.Done()

		var wg sync.WaitGroup
		wg.Add(1)
		msgs := telegramGenMsg(&wg, qTelegram)
		telegramSendMsg(msgs)
		wg.Wait()
	}()
}
