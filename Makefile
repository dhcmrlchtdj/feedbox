SHELL := bash
PATH := ./node_modules/.bin:$(PATH)

build:
	@$(MAKE) -j --no-print-directory build_backend build_frontend build_cfworker

dev:
	cd ./pkg/frontend && pnpm run dev & \
		cd ./pkg/backend && pnpm run dev & \
		wait

fmt:
	prettier --write .

clean:
	rm -rf ./pkg/backend/_build ./pkg/frontend/_build

start:
	node ./pkg/backend/_build/bin/server.js

test:
	cd ./pkg/backend && DISABLE_LOGGER=true pnpx jest

test_update:
	cd ./pkg/backend && DISABLE_LOGGER=true pnpx jest -u

build_backend:
	cd ./pkg/backend && pnpm run build

build_frontend:
	cd ./pkg/frontend && pnpm run build

build_cfworker:
	cd ./pkg/cfworker && pnpm run build

up_db:
	migrate up \
		--store=./pkg/backend/_build/migration/pg-store.js \
		--migrations-dir=./pkg/backend/_build/migration \
		--matches='r*.js'

down_db:
	migrate down \
		--store=./pkg/backend/_build/migration/pg-store.js \
		--migrations-dir=./pkg/backend/_build/migration \
		--matches='r*.js'

ci_test:
	npm i -g pnpm@5
	pnpm install --ignore-scripts --prod=false
	@$(MAKE) --no-print-directory clean
	@$(MAKE) --no-print-directory build
	@$(MAKE) --no-print-directory up_db
	@$(MAKE) --no-print-directory test

heroku_build:
	npm i -g pnpm@5
	pnpm install --ignore-scripts --prod=false
	@$(MAKE) --no-print-directory clean
	@$(MAKE) --no-print-directory build
	@$(MAKE) --no-print-directory up_db

.PHONY: build build_backend build_frontend build_cfworker
.PHONY: start dev
.PHONY: test test_update ci_test
.PHONY: up_db down_db
.PHONY: fmt clean
.PHONY: heroku_build
