package util

import (
	"testing"

	"github.com/bradleyjkemp/cupaloy"
)

func TestExtractLinksFromOPML(t *testing.T) {
	opml := []byte(`
	<?xml version="1.0" encoding="utf-8"?>
	<opml version="1.0">
	<head><title>feeds</title></head>
	<body>
	<outline type="rss" text="blog.cloudflare.com" xmlUrl="https://blog.cloudflare.com/rss/"/>
	<outline type="rss" text="v8.dev" xmlUrl="https://v8.dev/blog.atom"/>
	<outline type="rss" text="webkit.org" xmlUrl="https://webkit.org/feed/atom/"/>
	</body>
	</opml>
	`)
	links, err := ExtractLinksFromOPML(opml)
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
	opml := BuildOPML(feeds)
	cupaloy.SnapshotT(t, string(opml))
}
