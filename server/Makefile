SHELL := bash
PATH := ./node_modules/.bin:$(PATH)

build:
	tsc

release: clean
	$(MAKE) build

clean:
	rm -rf ./_build

fmt:
	prettier --write './{bin,lib,test}/**/*.{ts,js,json}' './*.json'

dev:
	nodemon -w ./_build _build/bin/server.js & tsc -w & wait

test: build
	@# yarn jest -u # update test
	jest

.PHONY: build clean fmt dev release test
