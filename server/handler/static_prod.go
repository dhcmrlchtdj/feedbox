//go:build !dev

package handler

import (
	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/ui"
)

func frontendReadFile(name string) ([]byte, error) {
	r, err := ui.Static.ReadFile(name)
	return r, errors.WithStack(err)
}
