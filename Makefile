SHELL := /bin/bash

.PHONY: show
show:
	@make -nprR | sed -ne '/^$$/{ n; /^[^#.]/{ s/:.*//; p; }; }' | sort -u

.PHONY:
push-heroku:
	git subtree push --prefix=server heroku master
