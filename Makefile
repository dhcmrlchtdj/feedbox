SHELL := bash

dev:
	$(MAKE) -j dev-server dev-web

dev-web:
	cd ./web && $(MAKE) dev

dev-server:
	cd ./server && $(MAKE) dev

.PHONY: dev dev-web dev-server
