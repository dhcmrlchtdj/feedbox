package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/mmcdole/gofeed"

	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/email"
	"github.com/dhcmrlchtdj/feedbox/internal/util"
)

type EmailPayload struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Content string `json:"content"`
}

func buildEmailPayload(to string, feed *database.Feed, item *gofeed.Item) (string, error) {
	subject, content := buildEmailContent(feed.URL, item)
	payload := EmailPayload{
		To:      to,
		Subject: subject,
		Content: content,
	}
	b, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func buildEmailContent(feedURL string, item *gofeed.Item) (string, string) {
	site := util.ExtractSiteName(feedURL)
	subject := fmt.Sprintf(`"%s" from "%s"`, item.Title, site)
	if strings.HasPrefix(feedURL, "https://rsshub.app/telegram/channel") {
		subject = fmt.Sprintf(`"%s" from "%s"`, item.Link, site)
	}

	var text strings.Builder
	text.WriteString(item.Link)
	if len(item.Categories) > 0 {
		text.WriteString("<br><br>")
		for _, tag := range item.Categories {
			text.WriteByte('#')
			text.WriteString(strings.TrimSpace(tag))
			text.WriteByte(' ')
		}
	}
	if item.Content != "" {
		text.WriteString("<br><br>")
		text.WriteString(item.Content)
	} else if item.Description != "" {
		text.WriteString("<br><br>")
		text.WriteString(item.Description)
	}

	return subject, text.String()
}

func handleEmailTask(ctx context.Context, task *database.Task) error {
	var payload EmailPayload
	if err := json.Unmarshal([]byte(task.Payload), &payload); err != nil {
		return err
	}
	return email.Send(ctx, payload.To, payload.Subject, payload.Content)
}
