package util_test

import (
	"testing"

	"github.com/bradleyjkemp/cupaloy"

	"github.com/dhcmrlchtdj/feedbox/util"
)

func TestExtractSiteName(t *testing.T) {
	tests := []string{
		"https://feeds.feedburner.com/example",
		"https://medium.com/feed/example",
		"https://dev.to/feed/example",
		"https://rsshub.app/example/example",
		"https://feed43.com/example.xml",
		"https://example.com/rss",
	}
	for _, test := range tests {
		t.Run(test, func(t *testing.T) {
			cupaloy.SnapshotT(t, util.ExtractSiteName(test))
		})
	}
}
