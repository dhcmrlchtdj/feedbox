package util

import (
	"bytes"
	"encoding/json"
	"io"
)

type JSONConsoleWriter struct {
	Out io.Writer
}

func (w JSONConsoleWriter) Write(data []byte) (int, error) {
	var evt map[string]any

	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.UseNumber()
	if err := decoder.Decode(&evt); err != nil {
		return 0, err
	}

	encoder := json.NewEncoder(w.Out)
	encoder.SetIndent("", "\t")
	if err := encoder.Encode(evt); err != nil {
		return 0, err
	}

	return len(data), nil
}
