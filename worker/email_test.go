package worker_test

import (
	"testing"

	"github.com/bradleyjkemp/cupaloy/v2"
	"github.com/mmcdole/gofeed"

	"github.com/dhcmrlchtdj/feedbox/worker"
)

func TestBuildEmailContent(t *testing.T) {
	tests := []struct {
		name    string
		feedURL string
		item    *gofeed.Item
	}{
		{
			name:    "common",
			feedURL: "https://example.com/rss",
			item: &gofeed.Item{
				Title:       "Test Title",
				Link:        "https://example.com/item1",
				Description: "Test Description",
				Categories:  []string{"tag1", "tag2"},
			},
		},
		{
			name:    "telegram",
			feedURL: "https://rsshub.app/telegram/channel/test",
			item: &gofeed.Item{
				Title:   "Test Title",
				Link:    "https://t.me/test/1",
				Content: "Test Content",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			subject, content := worker.BuildEmailContent(tt.feedURL, tt.item)
			cupaloy.SnapshotT(t, subject, content)
		})
	}
}
