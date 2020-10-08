package main

import (
	"bytes"
	"encoding/json"
	"io"
	"os"
)

type zerologPrettyPrint struct {
	Out io.Writer
}

func (w zerologPrettyPrint) Write(data []byte) (int, error) {
	var evt map[string]interface{}

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

var ZerologPrettyPrint = zerologPrettyPrint{Out: os.Stderr}
