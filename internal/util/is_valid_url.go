package util

import "net/url"

func IsValidURL(link string) bool {
	u, err := url.Parse(link)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return false
	}
	return true
}
