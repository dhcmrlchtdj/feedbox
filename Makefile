SHELL := bash
.SHELLFLAGS := -O globstar -e -u -o pipefail -c
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules
MAKEFLAGS += --no-builtin-variables

GOFLAGS := \
	-trimpath \
	-buildvcs=false \
	-buildmode=pie

###

.PHONY: dev build fmt lint test clean outdated upgrade

build:
	cd frontend && make build
	CGO_ENABLED=0 go build $(GOFLAGS) -o ./_build/app

dev:
	make --jobs=2 _dev_ui _dev_server

_dev_ui:
	cd frontend && make dev

_dev_server:
	CGO_ENABLED=0 go run -tags=dev -race ./main.go server 2>&1 | \
		jq -R '. as $$line | try fromjson catch $$line'

fmt:
	gopls format -w **/*.go
	gofumpt -w .

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

migrate: build
	./_build/app migrate up
