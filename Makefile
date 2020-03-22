SHELL := bash
PATH := ./node_modules/.bin:$(PATH)

build:
	tsc --module commonjs --outDir _build
	rollup -c

release: clean
	$(MAKE) build migrate_latest

migrate_latest: build
	knex --knexfile=./_build/server/models/config.js migrate:latest

dev:
	nodemon -w ./_build _build/bin/server.js & \
		tsc --module commonjs --outDir _build -w & \
		rollup -c -w & \
		wait

test: release
	jest

test_update: release
	jest -u

fmt:
	prettier --write '**/*.{ts,js,json,html}'

clean:
	rm -rf ./_build

.PHONY: build release migrate_latest dev test test_update fmt clean
