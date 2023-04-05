SHELL := bash
.SHELLFLAGS = -O globstar -c

GOFLAGS := \
	-trimpath \
	-buildvcs=false \
	-buildmode=pie

###

.PHONY: dev build fmt lint test clean outdated upgrade

build:
	cd frontend && $(MAKE) build
	go build $(GOFLAGS) -o ./_build/app

dev:
	$(MAKE) --jobs=2 _dev

_dev: _dev_ui _dev_server
_dev_ui:
	cd frontend && $(MAKE) dev
_dev_server:
	# make dev | jq -c -R '. as $line | try fromjson catch $line'
	go run -tags=dev -race ./main.go serverAndWorker 2>&1 | jq

fmt:
	gofumpt -w .
	goimports -w .

lint:
	golangci-lint run

test:
	ENV=test TZ=UTC go test -race ./internal/util
	ENV=test TZ=UTC go test -race ./internal/database/...
	ENV=test TZ=UTC go test -race ./server

clean:
	# rm -rf ./**/.snapshots
	go clean -testcache
	-rm -rf ./_build

# outdated:
#     go list -u -m -f '{{if not .Indirect}}{{.}}{{end}}' all

upgrade:
	go get -v -t -u ./...
	go mod tidy -v

###

.PHONY: test_update migrate

test_update:
	-ENV=test TZ=UTC UPDATE_SNAPSHOTS=true go test ./internal/util
	-ENV=test TZ=UTC UPDATE_SNAPSHOTS=true go test ./internal/database/sqlite
	-ENV=test TZ=UTC UPDATE_SNAPSHOTS=true go test ./server

# coverage:
#     ENV=test go test -cover -coverprofile=./_build/cover.out ./...
#     go tool cover -html=./_build/cover.out

migrate:
	./_build/app migrate up
