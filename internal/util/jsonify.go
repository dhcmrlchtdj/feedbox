package util

import "encoding/json"

func Jsonify(args ...any) string {
	b, err := json.Marshal(args)
	if err != nil {
		return err.Error()
	}
	return string(b)
}
