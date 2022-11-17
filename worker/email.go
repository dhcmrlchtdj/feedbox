package worker

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"github.com/dhcmrlchtdj/feedbox/internal/global"
	"github.com/dhcmrlchtdj/feedbox/internal/util"
	"github.com/rs/zerolog"
)

func isTelegramChannel(ghItem githubItem) bool {
	return strings.HasPrefix(ghItem.feed.URL, "https://rsshub.app/telegram/channel")
}

func sendEmail(ctx context.Context, done *sync.WaitGroup, qGithub <-chan githubItem) {
	logger := zerolog.Ctx(ctx)

	worker := func(x githubItem) {
		if len(x.users) == 0 {
			return
		}

		item := x.item

		site := util.ExtractSiteName(x.feed.URL)
		subject := fmt.Sprintf(`"%s" from "%s"`, item.Title, site)
		if isTelegramChannel(x) {
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
		content := text.String()

		for _, user := range x.users {
			err := global.Email.Send(ctx, user, subject, content)
			if err != nil {
				logger.Error().Str("module", "worker").Stack().Err(err).Send()
			}
		}
	}

	go func() {
		defer done.Done()

		for item := range qGithub {
			worker(item)
		}
	}()
}
