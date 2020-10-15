package multipart

import (
	"io"
	"mime/multipart"
	"strconv"
)

type BetterMultipart struct {
	mp          *multipart.Writer
	Err         error
	ContentType string
}

func New(w io.Writer) *BetterMultipart {
	mp := multipart.NewWriter(w)
	m := BetterMultipart{
		mp:          mp,
		ContentType: mp.FormDataContentType(),
		Err:         nil,
	}
	return &m
}

func (m *BetterMultipart) Str(name string, value string) *BetterMultipart {
	if m.Err == nil {
		m.Err = m.mp.WriteField(name, value)
	}
	return m
}

func (m *BetterMultipart) Int64(name string, value int64) *BetterMultipart {
	if m.Err == nil {
		v := strconv.FormatInt(value, 10)
		m.Err = m.mp.WriteField(name, v)
	}
	return m
}

func (m *BetterMultipart) File(name string, filename string, file io.Reader) *BetterMultipart {
	if m.Err != nil {
		return m
	}
	part, err := m.mp.CreateFormFile(name, filename)
	if err != nil {
		m.Err = err
		return m
	}
	_, m.Err = io.Copy(part, file)
	return m
}

func (m *BetterMultipart) Close() error {
	if m.Err == nil {
		m.Err = m.mp.Close()
	}
	return m.Err
}
