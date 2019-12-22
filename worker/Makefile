SHELL := bash
PATH := ./node_modules/.bin:$(PATH)

build: clean
	rollup -c

clean:
	rm -rf ./_build

fmt:
	prettier --write './src/**/*' './*.js' './*.json'

dev:
	tsc -w

.PHONY: build clean fmt dev
