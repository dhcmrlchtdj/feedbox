SHELL := /bin/bash
PATH := ./node_modules/.bin:$(PATH)

build:
	NODE_ENV=${NODE_ENV:-production} rollup -c
	echo "feedbox.h11.io" > ./_build/CNAME

clean:
	rm -rf ./_build

fmt:
	prettier --write './src/**/*' './*.js' './*.json'

dev:
	DEV_SERVER=true rollup -c -w

.PHONY: build clean fmt
