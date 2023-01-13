SHELL := bash
.SHELLFLAGS = -O globstar -c
PATH := ./node_modules/.bin:$(PATH)

###

.PHONY: dev build fmt lint test clean outdated upgrade

dev: node_modules/tsconfig.tsbuildinfo copy_static
	NODE_ENV=development node ./script/build_watch.js

build: node_modules/tsconfig.tsbuildinfo copy_static
	NODE_ENV=production node ./script/build_dist.js

fmt:
	prettier --write .

# lint:

# test:

# clean:

outdated:
	pnpm outdated

upgrade:
	pnpm update --latest # --interactive

###

.PHONY: copy_static check force

copy_static:
	cp -v src/static/* _build/

node_modules/tsconfig.tsbuildinfo: node_modules $(shell ls src/**/*.ts)
	@$(MAKE) --no-print-directory check

node_modules:
	pnpm install

check:
	tsc --noEmit
	@touch -cm node_modules/tsconfig.tsbuildinfo # force update mtime

force: check build
