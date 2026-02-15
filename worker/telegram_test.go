package worker_test

import (
	"testing"

	"github.com/bradleyjkemp/cupaloy/v2"
	"github.com/mmcdole/gofeed"

	"github.com/dhcmrlchtdj/feedbox/worker"
)

func TestBuildTelegramContent(t *testing.T) {
	tests := []struct {
		name    string
		feedURL string
		item    *gofeed.Item
	}{
		{
			name:    "common",
			feedURL: "https://example.com/rss",
			item: &gofeed.Item{
				Title:      "Test Title",
				Link:       "https://example.com/item1",
				Categories: []string{"tag1", "tag2"},
			},
		},
		{
			name:    "lobsters",
			feedURL: "https://lobste.rs/rss",
			item: &gofeed.Item{
				Title:      "Lobsters Title",
				Link:       "https://lobste.rs/s/test",
				Categories: []string{"tag1"},
				Custom:     map[string]string{"comments": "https://lobste.rs/s/test/comments"},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			content := worker.BuildTelegramContent(tt.feedURL, tt.item)
			cupaloy.SnapshotT(t, content)
		})
	}
}
