SHELL := bash
.SHELLFLAGS := -O globstar -e -u -o pipefail -c
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules
MAKEFLAGS += --no-builtin-variables

PATH := ./node_modules/.bin:$(PATH)

###

.PHONY: dev build fmt lint test clean outdated upgrade

build: clean node_modules/tsconfig.tsbuildinfo
	NODE_ENV=production node ./build_script/build.js

dev: clean node_modules/tsconfig.tsbuildinfo
	NODE_ENV=development node ./build_script/build.js --watch

fmt:
	oxfmt --write . "!pnpm-lock.yaml"

lint:
	oxlint --type-aware
	@echo ""
	oxfmt --check . "!pnpm-lock.yaml"

# test:

clean:
	-rm ./_build/*

outdated:
	pnpm outdated

upgrade:
	pnpm update --latest # --interactive

###

.PHONY: check force

node_modules/tsconfig.tsbuildinfo: node_modules
	@make --no-print-directory check

node_modules:
	pnpm install

check:
	tsgo --noEmit
	@touch -cm node_modules/tsconfig.tsbuildinfo # force update mtime

force: check build
