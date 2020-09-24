SHELL := bash
# PATH := ./frontend/node_modules/.bin:$(PATH)

build:
	go build -o ./_build/migrate ./cmd/migrate
	go build -o ./_build/server ./cmd/server
	go build -o ./_build/worker ./cmd/worker

clean:
	# rm -rf ./**/.snapshots
	# go clean -testcache ./...
	-rm -rf ./_build

fmt:
	gofumports -w .
	go vet ./...

test:
	-ENV=test TZ=UTC go test ./database
	-ENV=test go test ./server
	-ENV=test go test ./util

test_update:
	-ENV=test TZ=UTC UPDATE_SNAPSHOTS=true go test ./database
	-ENV=test UPDATE_SNAPSHOTS=true go test ./server
	-ENV=test UPDATE_SNAPSHOTS=true go test ./util

coverage:
	ENV=test go test -cover -coverprofile=./_build/cover.out ./...
	go tool cover -html=./_build/cover.out

migrate:
	./_build/migrate up
