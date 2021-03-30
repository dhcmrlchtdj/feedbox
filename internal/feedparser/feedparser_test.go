package feedparser

import (
	"io"
	"strings"
	"testing"

	"github.com/bradleyjkemp/cupaloy/v2"
)

func TestRemoveNonPrintable(t *testing.T) {
	xml := strings.NewReader("'\x08', '\x05'")
	r := removeNonPrintable(xml)
	printable, err := io.ReadAll(r)
	if err != nil {
		t.Fatal(err)
	}
	cupaloy.SnapshotT(t, string(printable))
}
