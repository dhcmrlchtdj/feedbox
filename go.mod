// +heroku goVersion go1.15
// +heroku install ./cmd/...

module github.com/dhcmrlchtdj/feedbox

go 1.15

require (
	github.com/PuerkitoBio/goquery v1.6.0 // indirect
	github.com/andybalholm/brotli v1.0.1 // indirect
	github.com/andybalholm/cascadia v1.2.0 // indirect
	github.com/bradleyjkemp/cupaloy/v2 v2.6.0
	github.com/cespare/xxhash/v2 v2.1.1
	github.com/gofiber/fiber/v2 v2.3.0
	github.com/golang-migrate/migrate/v4 v4.14.1
	github.com/hashicorp/errwrap v1.1.0 // indirect
	github.com/jackc/pgx/v4 v4.10.0
	github.com/joho/godotenv v1.3.0
	github.com/klauspost/compress v1.11.3 // indirect
	github.com/lib/pq v1.9.0 // indirect
	github.com/mmcdole/gofeed v1.1.0
	github.com/mmcdole/goxpp v0.0.0-20200921145534-2f3784f67354 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.1 // indirect
	github.com/pkg/errors v0.9.1
	github.com/rollbar/rollbar-go v1.2.0
	github.com/rs/zerolog v1.20.0
	golang.org/x/crypto v0.0.0-20201203163018-be400aefbc4c
	golang.org/x/net v0.0.0-20201202161906-c7110b5ffcbb // indirect
	golang.org/x/oauth2 v0.0.0-20201203001011-0b49973bad19
	golang.org/x/text v0.3.4 // indirect
	google.golang.org/appengine v1.6.7 // indirect
)

replace github.com/mmcdole/gofeed v1.1.0 => github.com/dhcmrlchtdj/gofeed v1.1.1-0.20201206234710-f0de7bc88afd
