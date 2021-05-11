package worker

import (
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/mmcdole/gofeed"
	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/email"
	"github.com/dhcmrlchtdj/feedbox/internal/feedparser"
	"github.com/dhcmrlchtdj/feedbox/internal/monitor"
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
	feed  database.Feed
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
	qFeed := slice2chan(&wg, feeds)

	wg.Add(1)
	qFeedItem := fetchFeed(&wg, qFeed)

	wg.Add(1)
	qGithub, qTelegram := dispatchFeed(&wg, qFeedItem)

	wg.Add(1)
	sendEmail(&wg, qGithub)

	wg.Add(1)
	sendTelegram(&wg, qTelegram)

	wg.Wait()
}

func slice2chan(done *sync.WaitGroup, feeds []database.Feed) <-chan database.Feed {
	qFeed := make(chan database.Feed)

	go func() {
		defer done.Done()

		for i := range feeds {
			qFeed <- feeds[i]
		}
		close(qFeed)
	}()

	return qFeed
}

func fetchFeed(done *sync.WaitGroup, qFeed <-chan database.Feed) <-chan *feedItem {
	qFeedItem := make(chan *feedItem)

	worker := func() {
		fp := feedparser.New()
		for dbFeed := range qFeed {
			feed, err := fp.ParseURL(dbFeed.URL)
			if err != nil {
				monitor.C.Warn(err)
				continue
			}
			if feed.Len() == 0 {
				continue
			}

			updated := getLatestUpdated(feed)
			if updated == nil {
				monitor.C.Warn(errors.Errorf("can not parse date field: %s", dbFeed.URL))
			}

			oldLinks, err := database.C.GetLinks(dbFeed.ID)
			if err != nil {
				monitor.C.Error(err)
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

			err = database.C.AddFeedLinks(dbFeed.ID, newLinks, updated)
			if err != nil {
				monitor.C.Error(err)
				continue
			}

			qFeedItem <- &feedItem{feed: dbFeed, items: newItems}
		}
	}

	go func() {
		defer done.Done()

		parallel(5, worker)
		close(qFeedItem)
	}()

	return qFeedItem
}

func getLatestUpdated(feed *gofeed.Feed) *time.Time {
	var latest *time.Time

	for _, item := range feed.Items {
		t := item.PublishedParsed
		if t != nil {
			if latest == nil || t.After(*latest) {
				latest = t
			}
		}
	}

	if latest == nil {
		latest = feed.UpdatedParsed
	}

	return latest
}

func dispatchFeed(done *sync.WaitGroup, qFeedItem <-chan *feedItem) (<-chan githubItem, <-chan telegramItem) {
	qGithub := make(chan githubItem, 100)
	qTelegram := make(chan telegramItem, 100)

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
			qGithub <- githubItem{feed, item, githubUsers}
			qTelegram <- telegramItem{feed, item, telegramUsers}
		}
	}

	go func() {
		defer done.Done()

		for item := range qFeedItem {
			worker(item)
		}
		close(qGithub)
		close(qTelegram)
	}()

	return qGithub, qTelegram
}

func sendEmail(done *sync.WaitGroup, qGithub <-chan githubItem) {
	worker := func(x githubItem) {
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
		defer done.Done()

		for item := range qGithub {
			worker(item)
		}
	}()
}
