package worker_test

import (
	"sync/atomic"
	"testing"
	"time"

	"github.com/bradleyjkemp/cupaloy/v2"
	"github.com/mmcdole/gofeed"

	"github.com/dhcmrlchtdj/feedbox/worker"
)

func TestSortFeedItems(t *testing.T) {
	now := time.Date(2026, 2, 15, 12, 0, 0, 0, time.UTC)
	past := now.Add(-time.Hour)
	future := now.Add(time.Hour)

	items := []*gofeed.Item{
		{Title: "now", PublishedParsed: &now},
		{Title: "past", PublishedParsed: &past},
		{Title: "future", PublishedParsed: &future},
		{Title: "nil1", PublishedParsed: nil},
		{Title: "nil2", PublishedParsed: nil},
	}

	results := []int{
		worker.SortFeedItems(items[0], items[1]), // now vs past: 1
		worker.SortFeedItems(items[1], items[0]), // past vs now: -1
		worker.SortFeedItems(items[3], items[0]), // nil vs now: 1
		worker.SortFeedItems(items[0], items[3]), // now vs nil: -1
		worker.SortFeedItems(items[3], items[4]), // nil vs nil: 0
	}

	cupaloy.SnapshotT(t, results)
}

func TestGetLatestUpdated(t *testing.T) {
	now := time.Date(2026, 2, 15, 12, 0, 0, 0, time.UTC)
	past := now.Add(-time.Hour)

	t.Run("from items", func(t *testing.T) {
		feed := &gofeed.Feed{
			Items: []*gofeed.Item{
				{PublishedParsed: &past},
				{PublishedParsed: &now},
			},
		}
		latest := worker.GetLatestUpdated(feed)
		if latest == nil || !latest.Equal(now) {
			t.Errorf("got %v, want %v", latest, now)
		}
	})

	t.Run("from feed", func(t *testing.T) {
		feed := &gofeed.Feed{
			UpdatedParsed: &now,
			Items: []*gofeed.Item{
				{PublishedParsed: nil},
			},
		}
		latest := worker.GetLatestUpdated(feed)
		if latest == nil || !latest.Equal(now) {
			t.Errorf("got %v, want %v", latest, now)
		}
	})

	t.Run("nil", func(t *testing.T) {
		feed := &gofeed.Feed{}
		latest := worker.GetLatestUpdated(feed)
		if latest != nil {
			t.Errorf("got %v, want nil", latest)
		}
	})
}

func TestParallel(t *testing.T) {
	var count atomic.Int32
	worker.Parallel(5, func() {
		count.Add(1)
	})
	if count.Load() != 5 {
		t.Errorf("got %d, want 5", count.Load())
	}
}
