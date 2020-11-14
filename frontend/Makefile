SHELL := bash
PATH := ./node_modules/.bin:$(PATH)

build: node_modules
	rm -rf ./_build
	NODE_ENV=production rollup -c

node_modules:
	pnpm install

dev:
	rollup -c -w

fmt:
	prettier --write .

upgrade_dep:
	pnpm upgrade --latest -i
	# pnpm store prune
