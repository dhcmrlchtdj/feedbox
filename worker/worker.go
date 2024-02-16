package worker

import (
	"context"
	"slices"
	"strconv"
	"sync"
	"time"

	"github.com/mmcdole/gofeed"
	"github.com/morikuni/failure"
	"github.com/rs/xid"
	"github.com/rs/zerolog"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/feedparser"
	"github.com/dhcmrlchtdj/feedbox/internal/global"
)

type feedItem struct {
	feed    *database.Feed
	fetched *gofeed.Feed
	etag    string
	items   []gofeed.Item
}

type githubItem struct {
	feed  *database.Feed
	item  *gofeed.Item
	users []string
}

type telegramItem struct {
	feed  *database.Feed
	item  *gofeed.Item
	users []int64
}

func Start(ctx context.Context) {
	logger := zerolog.Ctx(ctx).With().Str("traceId", xid.New().String()).Logger()
	ctx = logger.WithContext(ctx)

	logger.Info().Str("module", "worker").Msg("start")

	var wg sync.WaitGroup
	qFeed := slice2chan(ctx, &wg)
	qFeedFetched := fetchFeed(ctx, &wg, qFeed)
	qFeedParsed := parseFeed(ctx, &wg, qFeedFetched)
	qGithub, qTelegram := dispatchFeed(ctx, &wg, qFeedParsed)
	sendEmail(ctx, &wg, qGithub)
	sendTelegram(ctx, &wg, qTelegram)
	wg.Wait()

	logger.Info().Str("module", "worker").Msg("completed")
}

func slice2chan(ctx context.Context, done *sync.WaitGroup) <-chan database.Feed {
	logger := zerolog.Ctx(ctx)

	qFeed := make(chan database.Feed)

	done.Add(1)
	go func() {
		defer done.Done()

		feeds, err := global.Database.GetActiveFeeds(ctx)
		if err != nil {
			logger.Error().Str("module", "worker").Stack().Err(err).Send()
			return
		}

		for i := range feeds {
			qFeed <- feeds[i]
		}

		close(qFeed)
	}()

	return qFeed
}

func fetchFeed(ctx context.Context, done *sync.WaitGroup, qFeed <-chan database.Feed) <-chan *feedItem {
	logger := zerolog.Ctx(ctx)

	qFeedFetched := make(chan *feedItem)

	worker := func() {
		fp := feedparser.New()
		for databaseFeed := range qFeed {
			dbFeed := databaseFeed
			feed, etag, err := fp.ParseURL(ctx, dbFeed.URL, dbFeed.ETag)
			if err != nil {
				logger.Warn().Str("module", "worker").Stack().Err(err).Send()
				continue
			}

			if feed == nil {
				continue
			}

			qFeedFetched <- &feedItem{feed: &dbFeed, fetched: feed, etag: etag, items: nil}
		}
	}

	done.Add(1)
	go func() {
		defer done.Done()

		parallel(5, worker)
		close(qFeedFetched)
	}()

	return qFeedFetched
}

func parseFeed(ctx context.Context, done *sync.WaitGroup, qFeedFetched <-chan *feedItem) <-chan *feedItem {
	logger := zerolog.Ctx(ctx)

	qFeedParsed := make(chan *feedItem)

	worker := func(feed *feedItem) {
		updated := getLatestUpdated(feed.fetched)
		if updated == nil {
			err := failure.Unexpected(
				"can not parse date field",
				failure.Message(feed.feed.URL),
			)
			logger.Warn().Str("module", "worker").Stack().Err(err).Send()
			now := time.Now()
			updated = &now
		}

		if feed.fetched.Len() == 0 {
			err := updateFeedStatus(ctx, feed.feed, updated, feed.etag)
			if err != nil {
				logger.Warn().Str("module", "worker").Stack().Err(err).Send()
			}
			return
		}

		oldLinks, err := global.Database.GetLinks(ctx, feed.feed.ID)
		if err != nil {
			logger.Error().Str("module", "worker").Stack().Err(err).Send()
			return
		}
		oldLinkSet := map[string]bool{}
		for _, link := range oldLinks {
			oldLinkSet[link] = true
		}

		newLinks := []string{}
		newItems := []gofeed.Item{}
		for i := range feed.fetched.Items {
			item := feed.fetched.Items[i]
			link := item.Link
			if _, present := oldLinkSet[link]; !present {
				oldLinkSet[link] = true
				newLinks = append(newLinks, link)
				newItems = append(newItems, *item)
			}
		}

		if len(newItems) == 0 {
			err := updateFeedStatus(ctx, feed.feed, updated, feed.etag)
			if err != nil {
				logger.Warn().Str("module", "worker").Stack().Err(err).Send()
			}
			return
		}

		err = global.Database.AddFeedLinks(ctx, feed.feed.ID, newLinks, updated, feed.etag)
		if err != nil {
			logger.Error().Str("module", "worker").Stack().Err(err).Send()
			return
		}

		feed.items = newItems
		qFeedParsed <- feed
	}

	done.Add(1)
	go func() {
		defer done.Done()
		for feed := range qFeedFetched {
			feed := feed
			worker(feed)
		}
		close(qFeedParsed)
	}()

	return qFeedParsed
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

func updateFeedStatus(ctx context.Context, dbFeed *database.Feed, updated *time.Time, etag string) error {
	if dbFeed.ETag != etag {
		return global.Database.SetFeedUpdated(ctx, dbFeed.ID, updated, etag)
	}
	return nil
}

func dispatchFeed(ctx context.Context, done *sync.WaitGroup, qFeedItem <-chan *feedItem) (<-chan githubItem, <-chan telegramItem) {
	logger := zerolog.Ctx(ctx)

	qGithub := make(chan githubItem)
	qTelegram := make(chan telegramItem)

	worker := func(item *feedItem) {
		slices.SortFunc(item.items, func(a gofeed.Item, b gofeed.Item) int {
			x := a.PublishedParsed
			y := b.PublishedParsed
			if x != nil && y != nil {
				if x.Before(*y) {
					return -1
				} else {
					return 1
				}
			} else if x != nil {
				return -1
			} else if y != nil {
				return 1
			} else {
				return 0
			}
		})

		feed := item.feed
		users, err := global.Database.GetSubscribers(ctx, feed.ID)
		if err != nil {
			logger.Error().Str("module", "worker").Stack().Err(err).Send()
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
					logger.Error().Str("module", "worker").Stack().Err(err).Send()
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

	done.Add(1)
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
