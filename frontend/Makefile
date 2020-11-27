SHELL := bash
PATH := ./node_modules/.bin:$(PATH)

all: build check

build:
	NODE_ENV=production node ./script/build.js

check:
	tsc --noEmit

fmt:
	prettier --write .

upgrade_dep:
	pnpm upgrade --latest --interactive
	@# pnpm store prune
