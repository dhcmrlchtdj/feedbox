SHELL := bash
PATH := ./node_modules/.bin:$(PATH)

build:
	tsc
	rollup -c

test: build
	node ./_build/test/index.js

release: clean
	$(MAKE) build

clean:
	rm -rf ./_build

fmt:
	prettier --write './{bin,lib,test}/**/*.{ts,js,json}' './*.json'

dev:
	tsc -w

.PHONY: build clean fmt dev release test
