package worker

import (
	"context"
	"slices"
	"sync"
	"time"

	"github.com/mmcdole/gofeed"
	"github.com/pkg/errors"
	"github.com/rs/xid"
	"github.com/rs/zerolog"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/feedparser"
)

type feedItem struct {
	feed    *database.Feed
	fetched *gofeed.Feed
	etag    string
	items   []*gofeed.Item
}

func Start(ctx context.Context) {
	logger := zerolog.Ctx(ctx).With().Str("traceId", xid.New().String()).Logger()
	ctx = logger.WithContext(ctx)

	logger.Info().Str("module", "worker").Msg("start")

	var wg sync.WaitGroup
	qFeed := slice2chan(ctx, &wg)
	qFeedFetched := fetchFeed(ctx, &wg, qFeed)
	qFeedParsed := parseFeed(ctx, &wg, qFeedFetched)
	dispatchFeed(ctx, &wg, qFeedParsed)
	wg.Wait()

	processQueue(ctx)

	logger.Info().Str("module", "worker").Msg("completed")
}

func slice2chan(ctx context.Context, done *sync.WaitGroup) <-chan database.Feed {
	logger := zerolog.Ctx(ctx)

	qFeed := make(chan database.Feed)

	done.Go(func() {
		defer close(qFeed)

		feeds, err := database.GetActiveFeeds(ctx)
		if err != nil {
			logger.Error().Str("module", "worker").Stack().Err(err).Send()
			return
		}

		for _, f := range feeds {
			select {
			case <-ctx.Done():
				return
			case qFeed <- f:
			}
		}
	})

	return qFeed
}

func fetchFeed(ctx context.Context, done *sync.WaitGroup, qFeed <-chan database.Feed) <-chan *feedItem {
	logger := zerolog.Ctx(ctx)

	qFeedFetched := make(chan *feedItem)

	worker := func() {
		fp := feedparser.New()
		for dbFeed := range qFeed {
			feed, etag, err := fp.ParseURL(ctx, dbFeed.URL, dbFeed.ETag)
			if err != nil {
				logger.Warn().Str("module", "worker").Stack().Err(err).Send()
				if err2 := database.SetFeedErr(ctx, dbFeed.ID, err.Error()); err2 != nil {
					logger.Error().Str("module", "worker").Stack().Err(err2).Send()
				}
				continue
			}

			if dbFeed.Err != "" {
				if err := database.RemoveFeedErr(ctx, dbFeed.ID); err != nil {
					logger.Error().Str("module", "worker").Stack().Err(err).Send()
				}
			}

			if feed == nil {
				continue
			}

			qFeedFetched <- &feedItem{feed: &dbFeed, fetched: feed, etag: etag, items: nil}
		}
	}

	done.Go(func() {
		defer close(qFeedFetched)

		parallel(5, worker)
	})

	return qFeedFetched
}

func parseFeed(ctx context.Context, done *sync.WaitGroup, qFeedFetched <-chan *feedItem) <-chan *feedItem {
	logger := zerolog.Ctx(ctx)

	qFeedParsed := make(chan *feedItem)

	now := time.Now()
	worker := func(feed *feedItem) {
		updated := getLatestUpdated(feed.fetched)
		if updated == nil {
			err := errors.WithMessage(errors.New("can't parse date field"), feed.feed.URL)
			logger.Warn().Str("module", "worker").Stack().Err(err).Send()
			updated = &now
		}
		if updated.Compare(now) > 0 {
			updated = &now
		}

		if feed.fetched.Len() == 0 {
			err := updateFeedStatus(ctx, feed.feed, updated, feed.etag)
			if err != nil {
				logger.Warn().Str("module", "worker").Stack().Err(err).Send()
			}
			return
		}

		oldLinks, err := database.GetLinks(ctx, feed.feed.ID)
		if err != nil {
			logger.Error().Str("module", "worker").Stack().Err(err).Send()
			return
		}
		oldLinkSet := map[string]bool{}
		for _, link := range oldLinks {
			oldLinkSet[link] = true
		}

		newLinks := []string{}
		newItems := []*gofeed.Item{}
		for i := range feed.fetched.Items {
			item := feed.fetched.Items[i]
			link := item.Link
			if _, present := oldLinkSet[link]; !present {
				oldLinkSet[link] = true
				newLinks = append(newLinks, link)
				newItems = append(newItems, item)
			}
		}

		if len(newItems) == 0 {
			err = updateFeedStatus(ctx, feed.feed, updated, feed.etag)
			if err != nil {
				logger.Warn().Str("module", "worker").Stack().Err(err).Send()
			}
			return
		}

		err = database.AddFeedLinks(ctx, feed.feed.ID, newLinks, updated, feed.etag)
		if err != nil {
			logger.Error().Str("module", "worker").Stack().Err(err).Send()
			return
		}

		feed.items = newItems
		qFeedParsed <- feed
	}

	done.Go(func() {
		defer close(qFeedParsed)
		for feed := range qFeedFetched {
			worker(feed)
		}
	})

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
		return database.SetFeedUpdated(ctx, dbFeed.ID, updated, etag)
	}
	return nil
}

func sortFeedItems(a *gofeed.Item, b *gofeed.Item) int {
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
}

func dispatchFeed(ctx context.Context, done *sync.WaitGroup, qFeedItem <-chan *feedItem) {
	logger := zerolog.Ctx(ctx)

	worker := func(item *feedItem) {
		feed := item.feed
		users, err := database.GetSubscribers(ctx, feed.ID)
		if err != nil {
			logger.Error().Str("module", "worker").Stack().Err(err).Send()
			return
		}

		slices.SortFunc(item.items, sortFeedItems)

		for i := range item.items {
			rssItem := item.items[i]
			for _, user := range users {
				var platform string
				var payload string
				var err error

				switch user.Platform {
				case "github":
					platform = "email"
					payload, err = buildEmailPayload(user.Addition["email"], feed, rssItem)
				case "telegram":
					platform = "telegram"
					payload, err = buildTelegramPayload(user.PID, feed, rssItem)
				default:
					logger.Error().Str("module", "worker").Str("platform", user.Platform).Msg("unknow user platform")
					continue
				}

				if err != nil {
					logger.Error().Str("module", "worker").Stack().Err(err).Send()
					continue
				}

				if payload != "" {
					err = database.PushTask(ctx, platform, payload)
					if err != nil {
						logger.Error().Str("module", "worker").Stack().Err(err).Send()
					}
				}
			}
		}
	}

	done.Go(func() {
		for item := range qFeedItem {
			worker(item)
		}
	})
}

func processQueue(ctx context.Context) {
	logger := zerolog.Ctx(ctx)
	tasks, err := database.PopTasks(ctx)
	if err != nil {
		logger.Error().Str("module", "worker").Stack().Err(err).Send()
		return
	}

	rl := NewRateLimiter(10, time.Second)
	for i := range tasks {
		rl.Wait()
		task := &tasks[i]

		var err error
		switch task.Platform {
		case "email":
			err = handleEmailTask(ctx, task)
		case "telegram":
			err = handleTelegramTask(ctx, task)
		default:
			logger.Error().Str("module", "worker").Str("platform", task.Platform).Msg("unknown task platform")
			continue
		}

		if err != nil {
			logger.Error().Str("module", "worker").Stack().Err(err).Send()
			if err := database.PushTask(ctx, task.Platform, task.Payload); err != nil {
				logger.Error().Str("module", "worker").Stack().Err(err).Send()
			}
		}
	}
}
