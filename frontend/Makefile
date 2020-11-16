SHELL := bash
PATH := ./node_modules/.bin:$(PATH)

build: node_modules
	rm -rf ./_build
	NODE_ENV=production rollup -c

dev: node_modules
	rollup -c -w

fmt:
	prettier --write .

node_modules:
	pnpm install

upgrade_dep:
	pnpm upgrade --latest -i
	# pnpm store prune
