SHELL := bash
PATH := ./node_modules/.bin:$(PATH)

build:
	tsc --module commonjs --outDir _build
	rollup -c

release:
	@$(MAKE) --no-print-directory clean
	@$(MAKE) --no-print-directory build
	@$(MAKE) --no-print-directory up_db

start:
	node ./_build/bin/server.js

up_db:
	migrate up \
		--store=./_build/migration/pg-store.js \
		--migrations-dir=./_build/migration \
		--matches='r*.js'

down_db:
	migrate down \
		--store=./_build/migration/pg-store.js \
		--migrations-dir=./_build/migration \
		--matches='r*.js'

dev:
	nodemon -w ./_build _build/bin/server.js & \
		tsc --module commonjs --outDir _build -w & \
		rollup -c -w & \
		wait

test:
	jest

test_update:
	jest -u

ci_test: release
	@$(MAKE) --no-print-directory test

fmt:
	prettier --write .

clean:
	rm -rf ./_build

.PHONY: build release dev test test_update fmt clean up_db down_db ci_test
