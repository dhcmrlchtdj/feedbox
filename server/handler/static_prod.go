//go:build !dev

package handler

import "github.com/dhcmrlchtdj/feedbox/frontend"

func frontendReadFile(name string) ([]byte, error) {
	return frontend.Static.ReadFile(name)
}
