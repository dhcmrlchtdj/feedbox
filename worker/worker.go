package worker

import (
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/mmcdole/gofeed"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/email"
	"github.com/dhcmrlchtdj/feedbox/internal/feedparser"
	"github.com/dhcmrlchtdj/feedbox/internal/monitor"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
	"github.com/dhcmrlchtdj/feedbox/internal/util"
)

type feedItem struct {
	feed  database.Feed
	items []gofeed.Item
}

type githubItem struct {
	feed  database.Feed
	item  *gofeed.Item
	users []string
}

type telegramItem struct {
	item  *gofeed.Item
	users []int64
}

func Start() {
	var wg sync.WaitGroup

	feeds, err := database.C.GetActiveFeeds()
	if err != nil {
		monitor.C.Error(err)
		return
	}

	wg.Add(1)
	qFeedItem := fetchFeed(&wg, feeds)

	wg.Add(1)
	qGithub, qTelegram := dispatchFeed(&wg, qFeedItem)

	wg.Add(1)
	sendEmail(&wg, qGithub)

	wg.Add(1)
	sendTelegram(&wg, qTelegram)

	wg.Wait()
}

func fetchFeed(done *sync.WaitGroup, feeds []database.Feed) <-chan *feedItem {
	qFeedItem := make(chan *feedItem)

	fp := feedparser.New()
	worker := func(dbFeed database.Feed) {
		feed, err := fp.ParseURL(dbFeed.URL)
		if err != nil {
			monitor.C.Warn(err)
			return
		}

		oldLinks, err := database.C.GetLinks(dbFeed.ID)
		if err != nil {
			monitor.C.Error(err)
			return
		}
		oldLinkSet := map[string]bool{}
		for _, link := range oldLinks {
			oldLinkSet[link] = true
		}

		newLinks := []string{}
		newItems := []gofeed.Item{}
		for i := range feed.Items {
			item := feed.Items[i]
			link := item.Link
			if _, present := oldLinkSet[link]; !present {
				oldLinkSet[link] = true
				newLinks = append(newLinks, link)
				newItems = append(newItems, *item)
			}
		}

		if len(newItems) == 0 {
			return
		}

		updated := newItems[0].PublishedParsed
		if updated == nil {
			updated = feed.UpdatedParsed
		}
		err = database.C.AddFeedLinks(dbFeed.ID, newLinks, updated)
		if err != nil {
			monitor.C.Error(err)
			return
		}

		qFeedItem <- &feedItem{feed: dbFeed, items: newItems}
	}

	go func() {
		for i := range feeds {
			worker(feeds[i])
		}

		close(qFeedItem)
		done.Done()
	}()

	return qFeedItem
}

func dispatchFeed(done *sync.WaitGroup, qFeedItem <-chan *feedItem) (<-chan *githubItem, <-chan *telegramItem) {
	qGithub := make(chan *githubItem, 100)
	qTelegram := make(chan *telegramItem, 100)

	worker := func(item *feedItem) {
		feed := item.feed
		users, err := database.C.GetSubscribers(feed.ID)
		if err != nil {
			monitor.C.Error(err)
			return
		}

		githubUsers := []string{}
		telegramUsers := []int64{}
		for _, user := range users {
			switch user.Platform {
			case "github":
				githubUsers = append(githubUsers, user.Addition["email"])
			case "telegram":
				pid, err := strconv.ParseInt(user.PID, 10, 64)
				if err != nil {
					monitor.C.Error(err)
				} else {
					telegramUsers = append(telegramUsers, pid)
				}
			}
		}
		for i := range item.items {
			item := &item.items[i]
			qGithub <- &githubItem{feed, item, githubUsers}
			qTelegram <- &telegramItem{item, telegramUsers}
		}
	}

	go func() {
		for item := range qFeedItem {
			worker(item)
		}

		close(qGithub)
		close(qTelegram)
		done.Done()
	}()

	return qGithub, qTelegram
}

func sendEmail(done *sync.WaitGroup, qGithub <-chan *githubItem) {
	worker := func(x *githubItem) {
		item := x.item

		site := util.ExtractSiteName(x.feed.URL)
		subject := fmt.Sprintf(`"%s" from "%s"`, item.Title, site)

		var text strings.Builder
		text.WriteString(item.Link)
		if len(item.Categories) > 0 {
			text.WriteString("<br><br>")
			for _, tag := range item.Categories {
				text.WriteByte('#')
				text.WriteString(strings.TrimSpace(tag))
				text.WriteByte(' ')
			}
		}
		if item.Content != "" {
			text.WriteString("<br><br>")
			text.WriteString(item.Content)
		} else if item.Description != "" {
			text.WriteString("<br><br>")
			text.WriteString(item.Description)
		}
		content := text.String()

		for _, user := range x.users {
			err := email.C.Send(user, subject, content)
			if err != nil {
				monitor.C.Error(err)
			}
		}
	}

	go func() {
		for item := range qGithub {
			worker(item)
		}

		done.Done()
	}()
}

func sendTelegram(done *sync.WaitGroup, qTelegram <-chan *telegramItem) {
	// https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this
	rateLimiter := NewRateLimiter(20, time.Second)

	worker := func(x *telegramItem) {
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
		if comment, ok := item.Custom["comments"]; ok {
			text.WriteString("\n\n")
			text.WriteString("comment: ")
			text.WriteString(comment)
		}
		content := text.String()

		for _, user := range x.users {
			rateLimiter.Wait()

			err := telegram.C.SendMessage(&telegram.SendMessagePayload{
				ChatID: user,
				Text:   content,
			})
			if err != nil {
				monitor.C.Error(err)
			}
		}
	}

	go func() {
		for item := range qTelegram {
			worker(item)
		}

		done.Done()
	}()
}
