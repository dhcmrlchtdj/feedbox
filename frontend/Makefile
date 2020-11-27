SHELL := bash
PATH := ./node_modules/.bin:$(PATH)

build: node_modules
	rm -rf ./_build
	NODE_ENV=production node ./script/build.js

fmt:
	prettier --write .

node_modules:
	pnpm install

upgrade_dep:
	pnpm upgrade --latest -i
	# pnpm store prune
