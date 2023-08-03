package util_test

import (
	"testing"

	"github.com/dhcmrlchtdj/feedbox/internal/util"
)

func TestExtractSiteName(t *testing.T) {
	f := func(link string, name string) {
		t.Helper()
		extracted := util.ExtractSiteName(link)
		if extracted != name {
			t.Errorf("expected: %#v, got: %#v", name, extracted)
		}
	}

	f("https://feeds.feedburner.com/example", "feedburner/example")
	f("https://medium.com/feed/example", "medium/example")
	f("https://dev.to/feed/example", "dev.to/example")
	f("https://rsshub.app/example/example", "rsshub/example/example")
	f("https://feed43.com/example.xml", "feed43/example")
	f("https://buttondown.email/example/rss", "buttondown/example")
	f("https://example.com/rss", "example.com")
}
