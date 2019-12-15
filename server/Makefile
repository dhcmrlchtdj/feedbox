SHELL := /bin/bash
PATH := ./node_modules/.bin:$(PATH)

build: clean
	tsc

clean:
	rm -rf ./_build

fmt:
	prettier --write './src/**/*.ts' './*.json'

dev:
	nodemon -w ./_build _build/index.js & tsc -w & wait

.PHONY: build clean fmt
