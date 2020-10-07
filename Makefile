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

test:
	go vet ./...
	ENV=test TZ=UTC go test ./server
	ENV=test TZ=UTC go test ./internal/database
	ENV=test TZ=UTC go test ./internal/util

test_update:
	-ENV=test TZ=UTC UPDATE_SNAPSHOTS=true go test ./server
	-ENV=test TZ=UTC UPDATE_SNAPSHOTS=true go test ./internal/database
	-ENV=test TZ=UTC UPDATE_SNAPSHOTS=true go test ./internal/util

# coverage:
#     ENV=test go test -cover -coverprofile=./_build/cover.out ./...
#     go tool cover -html=./_build/cover.out

migrate:
	./_build/migrate up

# outdated:
#     go list -u -m -f '{{if not .Indirect}}{{.}}{{end}}' all
# upgrade_dep:
#     go get -t -u ./...
