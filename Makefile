SHELL := /bin/bash

.PHONY: show
show:
	@make -nprR | sed -ne '/^$$/{ n; /^[^#.]/{ s/:.*//; p; }; }' | sort -u

.PHONY:
push-heroku:
	git subtree push --prefix=server heroku master

.PHONY:
push-gh-pages:
	git subtree push --prefix=web/dist origin gh-pages
