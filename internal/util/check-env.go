package util

import (
	"log"
	"os"
)

func CheckEnvs(names ...string) {
	for _, name := range names {
		if os.Getenv(name) == "" {
			log.Fatalf("checkenvs: '%v' missing\n", name)
		}
	}
}
