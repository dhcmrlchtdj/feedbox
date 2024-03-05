//go:build !dev

package handler

import (
	"github.com/pkg/errors"

	"github.com/dhcmrlchtdj/feedbox/frontend"
)

func frontendReadFile(name string) ([]byte, error) {
	r, err := frontend.Static.ReadFile(name)
	return r, errors.WithStack(err)
}
