package worker_test

import (
	"testing"

	"github.com/bradleyjkemp/cupaloy"

	"github.com/dhcmrlchtdj/feedbox/worker"
)

func TestParseRSSComment(t *testing.T) {
	rss := `<?xml version="1.0" encoding="utf-8"?>
	<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
		<channel>
			<title>Lobsters</title>
			<description></description>
			<link>https://lobste.rs/</link>
			<atom:link href="https://lobste.rs/rss" rel="self" type="application/rss+xml" />
			<item>
				<title>A Pipeline Made of Airbags</title>
				<link>https://ferd.ca/a-pipeline-made-of-airbags.html</link>
				<guid isPermaLink="false">https://lobste.rs/s/uuex13</guid>
				<author>ferd@users.lobste.rs (ferd)</author>
				<pubDate>Thu, 24 Sep 2020 07:12:40 -0500</pubDate>
				<comments>https://lobste.rs/s/uuex13/pipeline_made_airbags</comments>
				<description>&lt;p&gt;&lt;a href="https://lobste.rs/s/uuex13/pipeline_made_airbags"&gt;Comments&lt;/a&gt;&lt;/p&gt;</description>
				<category>devops</category>
				<category>erlang</category>
			</item>
		</channel>
	</rss>
	`
	parser := worker.NewFeedParser()
	feed, err := parser.ParseString(rss)
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, feed)
}
