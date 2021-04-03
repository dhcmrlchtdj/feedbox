SHELL := bash
.SHELLFLAGS = -O globstar -c
PATH := ./node_modules/.bin:$(PATH)

build: node_modules/tsconfig.tsbuildinfo
	NODE_ENV=production node ./script/build.js

dev:
	chokidar 'src' --command='make --no-print-directory build' --initial

check:
	tsc --noEmit
	@touch -cm node_modules/tsconfig.tsbuildinfo # force update mtime

force: check build

fmt:
	prettier --write .

node_modules:
	pnpm install

node_modules/tsconfig.tsbuildinfo: node_modules $(shell ls src/**/*.ts)
	@$(MAKE) --no-print-directory check

.PHONY: build check force fmt
