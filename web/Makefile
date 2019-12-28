SHELL := bash
PATH := ./node_modules/.bin:$(PATH)

build:
	rollup -c
	echo "feedbox.h11.io" > ./_build/CNAME

release: clean
	$(MAKE) build

clean:
	rm -rf ./_build

fmt:
	prettier --write './{src,rollup-plugin}/**/*.{ts,js,json}' './*.json'

dev:
	DEV_SERVER=true rollup -c -w

.PHONY: build release clean fmt dev
