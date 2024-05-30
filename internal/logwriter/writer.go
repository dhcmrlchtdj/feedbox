package logwriter

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"sync"
)

type HttpLogWriter struct {
	client http.Client
	once   sync.Once
	ch     chan []byte
	pool   sync.Pool
}

func NewHttpLogWriter() *HttpLogWriter {
	return &HttpLogWriter{
		client: http.Client{},
		once:   sync.Once{},
		pool: sync.Pool{
			New: func() any {
				return make([]byte, 0, 1024)
			},
		},
	}
}

func (w *HttpLogWriter) Close() error {
	println("closed")
	close(w.ch)
	println("closed")
	return nil
}

func (w *HttpLogWriter) Write(p []byte) (int, error) {
	w.once.Do(func() {
		w.ch = make(chan []byte)
		go func() {
			buf := make([]byte, 0, 1024)
			for m := range w.ch {
				println(m)
				buf = append(buf, m...)
				w.pool.Put(m)
				if len(buf) > 128 {
					err := w.send(buf)
					println(err.Error())
					buf = buf[:]
				}
			}
			println("closedddd")
			if len(buf) > 0 {
				err := w.send(buf)
				println(err.Error())
			}
		}()
	})

	buf := w.pool.Get().([]byte)
	buf = append(buf[:0], p...)
	println(buf)
	w.ch <- buf
	return len(p), nil
}

func (w *HttpLogWriter) send(body []byte) error {
	req, err := http.NewRequestWithContext(
		context.Background(),
		http.MethodPost,
		"http://localhost:9428/insert/jsonline",
		bytes.NewReader(body),
	)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/stream+json")
	resp, err := w.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// TODO
	// check http status

	return nil
}

var _ io.Writer = (*HttpLogWriter)(nil)
var _ io.Closer = (*HttpLogWriter)(nil)
