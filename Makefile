SHELL := /bin/bash

.PHONY: show
show:
	@make -nprR | sed -ne '/^$$/{ n; /^[^#.]/{ s/:.*//; p; }; }' | sort -u

.PHONY:
push-heroku:
	git subtree push --prefix=server heroku master

# make -j2 dev
.PHONY:
dev: dev-server dev-web
.PHONY:
dev-server:
	cd ./server && yarn dev
.PHONY:
dev-web:
	cd ./web && yarn dev
