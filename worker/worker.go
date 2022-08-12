package worker

import (
	"sort"
	"strconv"
	"sync"
	"time"

	"github.com/mmcdole/gofeed"
	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/feedparser"
	"github.com/dhcmrlchtdj/feedbox/internal/monitor"
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
				now := time.Now()
				updated = &now
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

			err = database.C.AddFeedLinks(dbFeed.ID, newLinks, updated.UnixMilli())
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
	qGithub := make(chan githubItem)
	qTelegram := make(chan telegramItem)

	worker := func(item *feedItem) {
		sort.Sort(item)

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

func (f *feedItem) Len() int {
	return len(f.items)
}

func (f *feedItem) Less(i int, k int) bool {
	x := f.items[i].PublishedParsed
	y := f.items[k].PublishedParsed
	if x != nil && y != nil {
		return x.Before(*y)
	} else {
		return false
	}
}

func (f *feedItem) Swap(i int, k int) {
	f.items[i], f.items[k] = f.items[k], f.items[i]
}
