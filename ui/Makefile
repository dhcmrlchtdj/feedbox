SHELL := bash
.SHELLFLAGS := -O globstar -e -u -o pipefail -c
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules
MAKEFLAGS += --no-builtin-variables

PATH := ./node_modules/.bin:$(PATH)

###

.PHONY: dev build fmt lint test clean outdated upgrade

build: clean lint
	NODE_ENV=production node ./build_script/build.js

dev: clean
	NODE_ENV=development node ./build_script/build.js --watch

fmt:
	oxfmt --write . "!pnpm-lock.yaml"

lint:
	tsc --noEmit
	@echo ""
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
