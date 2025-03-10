SHELL := bash
.SHELLFLAGS := -O globstar -e -u -o pipefail -c
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules
MAKEFLAGS += --no-builtin-variables

PATH := ./node_modules/.bin:$(PATH)

###

.PHONY: dev build fmt lint test clean outdated upgrade

build: clean node_modules/tsconfig.tsbuildinfo
	NODE_ENV=production node ./build_script/build_dist.js

dev: clean node_modules/tsconfig.tsbuildinfo
	NODE_ENV=development node ./build_script/build_watch.js

fmt:
	prettier --write . "!pnpm-lock.yaml"

lint:
	oxlint --deny-warnings \
		-D=correctness \
		-D=suspicious \
		-D=pedantic \
		-A=ban-ts-comment \
		-A=react-in-jsx-scope \
		-A=jsx-no-useless-fragment \
		-A=max-classes-per-file \
		-A=max-dependencies \
		-A=no-useless-undefined \
		-A=anchor-is-valid \
		-A=no-else-return \
		-A=no-control-regex \
		-A=max-lines-per-function \
		-A=max-depth \
		-A=max-nested-callbacks \
		--jsx-a11y-plugin \
		--react-perf-plugin \
		--promise-plugin \
		--import-plugin
	prettier --check . "!pnpm-lock.yaml"

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
	tsc --noEmit
	@touch -cm node_modules/tsconfig.tsbuildinfo # force update mtime

force: check build
