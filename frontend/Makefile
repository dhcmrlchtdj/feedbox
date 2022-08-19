SHELL := bash
.SHELLFLAGS = -O globstar -c
PATH := ./node_modules/.bin:$(PATH)

build: node_modules/tsconfig.tsbuildinfo
	@cp -v src/static/* _build/
	@NODE_ENV=production node ./script/build_dist.js

dev: node_modules/tsconfig.tsbuildinfo
	cp ./src/static/* ./_build/
	NODE_ENV=development node ./script/build_watch.js

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

outdated:
	pnpm outdated
upgrade:
	pnpm update --latest # --interactive

.PHONY: build check force fmt
