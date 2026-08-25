SHELL := bash
.SHELLFLAGS := -O globstar -e -u -o pipefail -c
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules
MAKEFLAGS += --no-builtin-variables

PATH := ./node_modules/.bin:$(PATH)

###

.PHONY: dev build fmt lint test clean outdated upgrade

build: clean node_modules lint
	NODE_ENV=production node ./build_script/build.js

dev: clean node_modules
	NODE_ENV=development node ./build_script/build.js --watch

fmt: node_modules
	oxfmt --write

lint: node_modules
	tsc --noEmit
	@echo ""
	oxlint --type-aware
	@echo ""
	oxfmt --check .

# test:

clean:
	-rm ./_build/*

outdated:
	pnpm outdated

upgrade:
	pnpm update --latest # --interactive

node_modules:
	pnpm install
