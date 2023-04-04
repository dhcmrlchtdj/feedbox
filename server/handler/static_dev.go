//go:build dev

package handler

import "os"

func frontendReadFile(name string) ([]byte, error) {
	return os.ReadFile("frontend/" + name)
}
