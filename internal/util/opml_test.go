package util_test

import (
	"strings"
	"testing"

	"github.com/bradleyjkemp/cupaloy/v2"

	"github.com/dhcmrlchtdj/feedbox/internal/util"
)

func TestExtractLinksFromOPML(t *testing.T) {
	opml := `
	<?xml version="1.0" encoding="utf-8"?>
	<opml version="1.0">
	<head><title>feeds</title></head>
	<body>
	<outline type="rss" text="blog.cloudflare.com" xmlUrl="https://blog.cloudflare.com/rss/"/>
	<outline type="rss" text="v8.dev" xmlUrl="https://v8.dev/blog.atom"/>
	<outline type="rss" text="webkit.org" xmlUrl="https://webkit.org/feed/atom/"/>
	</body>
	</opml>
	`
	links, err := util.ExtractLinksFromOPML(strings.NewReader(opml))
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, links)
}

func TestBuildOpml(t *testing.T) {
	feeds := []string{
		"https://blog.cloudflare.com/rss/",
		"https://v8.dev/blog.atom",
		"https://webkit.org/feed/atom/",
	}
	opml := util.BuildOPML(feeds)
	cupaloy.SnapshotT(t, string(opml))
}
