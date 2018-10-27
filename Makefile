SHELL := /bin/bash

.PHONY: usage
usage:
	@make -nprR | sed -ne '/^$$/{ n; /^[^#.]/{ s/:.*//; p; }; }' | sort -u

dev:
	echo 'dev'

start:
	echo 'start'
