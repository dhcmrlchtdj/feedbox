package util

import "os"

func CheckEnvs(names ...string) {
	for _, name := range names {
		if os.Getenv(name) == "" {
			panic("checkenvs: " + name)
		}
	}
}

func CheckEnvsExist(names ...string) bool {
	for _, name := range names {
		if os.Getenv(name) == "" {
			return false
		}
	}
	return true
}
