package util

import (
	"net/url"
	"path"
	"strings"
)

func ExtractSiteName(link string) string {
	u, err := url.Parse(link)
	if err != nil {
		return link
	}

	hostname := u.Hostname()
	switch hostname {
	case "feeds.feedburner.com":
		return "feedburner/" + path.Base(u.EscapedPath())
	case "medium.com":
		return "medium/" + path.Base(u.EscapedPath())
	case "dev.to":
		return "dev.to/" + path.Base(u.EscapedPath())
	case "rsshub.app":
		return "rsshub" + u.EscapedPath()
	case "feed43.com":
		p := u.EscapedPath()
		ext := path.Ext(p)
		return "feed43" + strings.TrimSuffix(p, ext)
	default:
		return hostname
	}
}
