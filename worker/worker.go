package worker

import (
	"fmt"
	"strconv"
	"strings"
	"sync"

	"github.com/mmcdole/gofeed"

	db "github.com/dhcmrlchtdj/feedbox/database"
	"github.com/dhcmrlchtdj/feedbox/service/email"
	"github.com/dhcmrlchtdj/feedbox/service/monitor"
	"github.com/dhcmrlchtdj/feedbox/service/telegram"
	"github.com/dhcmrlchtdj/feedbox/util"
)

type feedItem struct {
	feed  db.Feed
	items []gofeed.Item
}

type githubItem struct {
	feed  db.Feed
	item  gofeed.Item
	users []db.User
}

type telegramItem struct {
	item  gofeed.Item
	users []db.User
}

func Start() {
	var wg sync.WaitGroup
	qFeed := make(chan db.Feed)
	qFeedItem := make(chan *feedItem)
	qGithub := make(chan *githubItem)
	qTelegram := make(chan *telegramItem)

	feeds, err := db.Client.GetActiveFeeds()
	if err != nil {
		monitor.Client.Error(err)
		return
	}
	if len(feeds) == 0 {
		return
	}

	wg.Add(1)
	go func() {
		for _, feed := range feeds {
			qFeed <- feed
		}
		close(qFeed)
		wg.Done()
	}()

	wg.Add(1)
	go fetchFeed(&wg, qFeed, qFeedItem)

	wg.Add(1)
	go dispatchFeed(&wg, qFeedItem, qGithub, qTelegram)

	wg.Add(1)
	go sendEmail(&wg, qGithub)

	wg.Add(1)
	go sendTelegram(&wg, qTelegram)

	wg.Wait()
}

func fetchFeed(done *sync.WaitGroup, qFeed <-chan db.Feed, qFeedItem chan<- *feedItem) {
	work := func(wg *sync.WaitGroup) {
		defer wg.Done()
		feedParser := newFeedParser()
		for dbFeed := range qFeed {
			feed, err := feedParser.ParseURL(dbFeed.URL)
			if err != nil {
				monitor.Client.Error(err)
				continue
			}

			oldLinks, err := db.Client.GetLinks(dbFeed.ID)
			if err != nil {
				monitor.Client.Error(err)
				continue
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
				continue
			}

			updated := newItems[0].PublishedParsed
			if updated == nil {
				updated = feed.UpdatedParsed
			}
			err = db.Client.AddFeedLinks(dbFeed.ID, newLinks, updated)
			if err != nil {
				monitor.Client.Error(err)
				continue
			}

			qFeedItem <- &feedItem{feed: dbFeed, items: newItems}
		}
	}

	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go work(&wg)
	}
	wg.Wait()
	close(qFeedItem)
	done.Done()
}

func dispatchFeed(done *sync.WaitGroup, qFeedItem <-chan *feedItem, qGithub chan<- *githubItem, qTelegram chan<- *telegramItem) {
	work := func(wg *sync.WaitGroup) {
		defer wg.Done()
		for x := range qFeedItem {
			feed := x.feed
			users, err := db.Client.GetSubscribers(feed.ID)
			if err != nil {
				continue
			}

			githubUsers := []db.User{}
			telegramUsers := []db.User{}
			for _, user := range users {
				switch user.Platform {
				case "github":
					githubUsers = append(githubUsers, user)
				case "telegram":
					telegramUsers = append(telegramUsers, user)
				}
			}
			for i := range x.items {
				item := x.items[i]
				qGithub <- &githubItem{feed, item, githubUsers}
				qTelegram <- &telegramItem{item, telegramUsers}
			}
		}
	}

	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go work(&wg)
	}
	wg.Wait()
	close(qGithub)
	close(qTelegram)
	done.Done()
}

func sendEmail(done *sync.WaitGroup, qGithub <-chan *githubItem) {
	work := func(wg *sync.WaitGroup) {
		defer wg.Done()
		for x := range qGithub {
			item := x.item

			site := util.ExtractSiteName(x.feed.URL)
			subject := fmt.Sprintf(`"%s" from "%s"`, item.Title, site)

			var text strings.Builder
			text.WriteString(item.Link)
			if len(item.Categories) > 0 {
				text.WriteString("<br><br>")
				for _, tag := range item.Categories {
					text.WriteByte('#')
					text.WriteString(tag)
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
				err := email.Client.Send(user.Addition["email"], subject, content)
				if err != nil {
					monitor.Client.Error(err)
					continue
				}
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

func sendTelegram(done *sync.WaitGroup, qTelegram <-chan *telegramItem) {
	work := func(wg *sync.WaitGroup) {
		defer wg.Done()
		for x := range qTelegram {
			item := x.item

			var text strings.Builder
			text.WriteString(item.Link)
			if len(item.Categories) > 0 {
				text.WriteString("\n\n")
				for _, tag := range item.Categories {
					text.WriteByte('#')
					text.WriteString(tag)
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
				chatID, err := strconv.ParseInt(user.PID, 10, 64)
				if err != nil {
					monitor.Client.Error(err)
					continue
				}
				err = telegram.Client.SendMessage(&telegram.SendMessagePayload{
					ChatID: chatID,
					Text:   content,
				})
				if err != nil {
					monitor.Client.Error(err)
					continue
				}
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
