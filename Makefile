SHELL := bash
# PATH := ./frontend/node_modules/.bin:$(PATH)

GOFLAGS := \
	-trimpath \
	-buildmode=pie \
	-buildvcs=false \
	-mod=readonly

build:
	go build $(GOFLAGS) -o ./_build/migrate ./cmd/migrate
	go build $(GOFLAGS) -o ./_build/server ./cmd/server
	go build $(GOFLAGS) -o ./_build/worker ./cmd/worker

clean:
	# rm -rf ./**/.snapshots
	# go clean -testcache ./...
	-rm -rf ./_build

fmt:
	gofumpt -w .
	goimports -w .

lint:
	golangci-lint run

dev:
	cd frontend && make
	go run $(GOFLAGS) ./cmd/server

test:
	ENV=test TZ=UTC go test -race ./internal/util
	ENV=test TZ=UTC go test -race ./internal/database/sqlite
	ENV=test TZ=UTC go test -race ./server

test_update:
	-ENV=test TZ=UTC UPDATE_SNAPSHOTS=true go test ./internal/util
	-ENV=test TZ=UTC UPDATE_SNAPSHOTS=true go test ./internal/database/sqlite
	-ENV=test TZ=UTC UPDATE_SNAPSHOTS=true go test ./server

# coverage:
#     ENV=test go test -cover -coverprofile=./_build/cover.out ./...
#     go tool cover -html=./_build/cover.out

migrate:
	./_build/migrate up

# outdated:
#     go list -u -m -f '{{if not .Indirect}}{{.}}{{end}}' all
upgrade:
	go get -v -t -u ./...
	go mod tidy -v
