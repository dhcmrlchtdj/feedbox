package frontend

import "embed"

//go:embed _build/*
var Static embed.FS
