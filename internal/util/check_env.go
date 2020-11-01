package util

import "os"

func CheckEnvs(names ...string) {
	for _, name := range names {
		if os.Getenv(name) == "" {
			panic("checkenvs: " + name)
		}
	}
}
