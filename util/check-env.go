package util

import (
	"fmt"
	"os"
)

func CheckEnvs(names ...string) error {
	for _, name := range names {
		if os.Getenv(name) == "" {
			return fmt.Errorf("checkenvs: '%v' missing", name)
		}
	}
	return nil
}
