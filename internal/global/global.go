package global

import (
	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/email"
	"github.com/dhcmrlchtdj/feedbox/internal/monitor"
	"github.com/dhcmrlchtdj/feedbox/internal/sign"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
)

var (
	DB      *database.Database
	Monitor *monitor.Client
	Email   *email.Client
	TG      *telegram.Client
	Sign    *sign.Sign
)
