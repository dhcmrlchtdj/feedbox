SHELL := /bin/bash
PATH := ./node_modules/.bin:$(PATH)

build:
	tsc

test:
	echo "TODO"

clean:
	rm -rf ./_build

fmt:
	prettier --write './src/**/*' './*.js' './*.json'

doc:
	echo "TODO"

.PHONY: build test clean fmt doc
