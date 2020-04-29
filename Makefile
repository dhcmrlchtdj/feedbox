SHELL := bash
PATH := ./node_modules/.bin:$(PATH)

build: node_modules
	@$(MAKE) -j --no-print-directory build_backend build_frontend build_cfworker

node_modules:
	yarn install

dev:
	cd ./pkg/frontend && yarn dev & \
		cd ./pkg/backend && yarn dev & \
		wait

fmt:
	prettier --write .

clean:
	rm -rf ./pkg/_build

start:
	node ./pkg/_build/backend/bin/server.js

release:
	@$(MAKE) --no-print-directory clean
	@$(MAKE) --no-print-directory build
	@$(MAKE) --no-print-directory up_db

test:
	cd ./pkg/backend && DISABLE_LOGGER=true yarn jest

test_update:
	cd ./pkg/backend && DISABLE_LOGGER=true yarn jest -u

build_backend:
	cd ./pkg/backend && yarn build

build_common:
	cd ./pkg/common && yarn build

build_frontend: build_common
	cd ./pkg/frontend && yarn build

build_cfworker:
	cd ./pkg/cfworker && yarn build

up_db:
	migrate up \
		--store=./pkg/_build/backend/migration/pg-store.js \
		--migrations-dir=./pkg/_build/backend/migration \
		--matches='r*.js'

down_db:
	migrate down \
		--store=./pkg/_build/backend/migration/pg-store.js \
		--migrations-dir=./pkg/_build/backend/migration \
		--matches='r*.js'

ci_test: release
	@$(MAKE) --no-print-directory test

.PHONY: build build_backend build_common build_frontend build_cfworker
.PHONY: start release dev
.PHONY: test test_update ci_test
.PHONY: up_db down_db
.PHONY: fmt clean
