package util_test

import (
	"testing"

	"github.com/bradleyjkemp/cupaloy/v2"

	"github.com/dhcmrlchtdj/feedbox/internal/util"
)

func TestExtractSiteName(t *testing.T) {
	cases := []string{
		"https://feeds.feedburner.com/example",
		"https://medium.com/feed/example",
		"https://dev.to/feed/example",
		"https://rsshub.app/example/example",
		"https://feed43.com/example.xml",
		"https://example.com/rss",
		"https://buttondown.email/example/rss",
	}
	for i := range cases {
		url := cases[i]
		t.Run(url, func(t *testing.T) {
			cupaloy.SnapshotT(t, util.ExtractSiteName(url))
		})
	}
}
