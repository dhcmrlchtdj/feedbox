package worker

import (
	"strings"
	"sync"

	"github.com/mmcdole/gofeed"

	"github.com/dhcmrlchtdj/feedbox/service/monitor"
	"github.com/dhcmrlchtdj/feedbox/service/telegram"
)

func sendTelegram(done *sync.WaitGroup, qTelegram <-chan *telegramItem) {
	work := func(wg *sync.WaitGroup) {
		defer wg.Done()
		for x := range qTelegram {
			item := x.item
			if isPodcast(item) {
				sendTelegramPodcast(x)
			} else {
				sendTelegramLink(x)
			}
		}
	}

	var wg sync.WaitGroup
	for i := 0; i < 3; i++ {
		wg.Add(1)
		go work(&wg)
	}
	wg.Wait()
	done.Done()
}

func isPodcast(item *gofeed.Item) bool {
	if len(item.Enclosures) > 0 {
		first := item.Enclosures[0]
		if first.Type == "audio/mpeg" {
			return true
		}
	}
	return false
}

func sendTelegramLink(tgItem *telegramItem) {
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
		err := telegram.Client.SendMessage(&telegram.SendMessagePayload{
			ChatID: user,
			Text:   content,
		})
		if err != nil {
			monitor.Client.Error(err)
			return
		}
	}
}

func sendTelegramPodcast(tgItem *telegramItem) {
	item := tgItem.item
	var text strings.Builder
	text.WriteString(item.Title)
	text.WriteString("\n\n")
	text.WriteString(item.Link)
	if len(item.Categories) > 0 {
		text.WriteString("\n\n")
		for _, tag := range item.Categories {
			text.WriteByte('#')
			text.WriteString(strings.TrimSpace(tag))
			text.WriteByte(' ')
		}
	}
	content := text.String()
	audio := item.Enclosures[0].URL

	for _, user := range tgItem.users {
		err := telegram.Client.SendAudio(&telegram.SendAudioPayload{
			ChatID:  user,
			Audio:   audio,
			Title:   item.Title,
			Caption: content,
		})
		if err != nil {
			monitor.Client.Error(err)
			return
		}
	}
}
