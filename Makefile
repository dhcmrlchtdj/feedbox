SHELL := bash
# PATH := ./frontend/node_modules/.bin:$(PATH)

GOFLAGS := \
	-trimpath \
	-buildmode=pie \
	-buildvcs=false \
	-ldflags='-s -w -linkmode=external'

build:
	go build $(GOFLAGS) -o ./_build/app

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
	# make dev | jq -c -R '. as $line | try fromjson catch $line'
	go run -race ./main.go serverAndWorker 2>&1 | jq

test:
	ENV=test TZ=UTC go test -race ./internal/util
	ENV=test TZ=UTC go test -race ./internal/database/...
	ENV=test TZ=UTC go test -race ./server

test_force:
	go clean -testcache ./...
	$(MAKE) test

test_update:
	-ENV=test TZ=UTC UPDATE_SNAPSHOTS=true go test ./internal/util
	-ENV=test TZ=UTC UPDATE_SNAPSHOTS=true go test ./internal/database/sqlite
	-ENV=test TZ=UTC UPDATE_SNAPSHOTS=true go test ./internal/database/postgresql
	-ENV=test TZ=UTC UPDATE_SNAPSHOTS=true go test ./server

# coverage:
#     ENV=test go test -cover -coverprofile=./_build/cover.out ./...
#     go tool cover -html=./_build/cover.out

migrate:
	./_build/app migrate up

# outdated:
#     go list -u -m -f '{{if not .Indirect}}{{.}}{{end}}' all
upgrade:
	go get -v -t -u ./...
	go mod tidy -v
