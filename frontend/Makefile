SHELL := bash
PATH := ./node_modules/.bin:$(PATH)

build:
	rm -rf ./_build
	NODE_ENV=production rollup -c

dev:
	rollup -c -w

fmt:
	prettier --write .