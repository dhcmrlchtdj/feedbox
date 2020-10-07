package global

import (
	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/email"
	"github.com/dhcmrlchtdj/feedbox/internal/monitor"
	"github.com/dhcmrlchtdj/feedbox/internal/sign"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
)

var (
	DB      *database.Database = new(database.Database)
	Monitor *monitor.Client    = new(monitor.Client)
	Email   *email.Client      = new(email.Client)
	TG      *telegram.Client   = new(telegram.Client)
	Sign    *sign.Sign         = new(sign.Sign)
)
