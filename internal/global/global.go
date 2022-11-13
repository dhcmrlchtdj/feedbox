package global

import (
	"github.com/dhcmrlchtdj/feedbox/internal/database"
	"github.com/dhcmrlchtdj/feedbox/internal/email"
	"github.com/dhcmrlchtdj/feedbox/internal/sign"
	"github.com/dhcmrlchtdj/feedbox/internal/telegram"
)

var (
	Database database.Database = nil
	Email    email.Client      = nil
	Telegram telegram.Client   = nil
	Sign     sign.Client       = nil
)
