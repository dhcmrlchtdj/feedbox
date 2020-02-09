SHELL := bash

dev:
	$(MAKE) -j dev-server dev-web

dev-web:
	cd ./web && $(MAKE) dev

dev-server:
	cd ./server && $(MAKE) dev

merge-web-to-server:
	cd ./server && $(MAKE) release
	cd ./web && $(MAKE) release
	mv ./web/_build ./server/_build/lib/static

.PHONY: dev dev-web dev-server
