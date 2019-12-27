SHELL := bash
PATH := ./node_modules/.bin:$(PATH)

build:
	tsc

release:
	$(MAKE) -j1 clean build migrate_latest

clean:
	rm -rf ./_build

fmt:
	prettier --write './{bin,lib,test}/**/*.{ts,js,json}' './*.json'

dev:
	nodemon -w ./_build _build/bin/server.js & tsc -w & wait

test: release
	jest

test_update: release
	jest -u

migrate_latest:
	knex --knexfile=./_build/lib/models/knexfile.js migrate:latest

.PHONY: build clean fmt dev release test test_update migrate_latest
