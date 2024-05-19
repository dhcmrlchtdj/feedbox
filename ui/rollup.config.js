import commonjs from "@rollup/plugin-commonjs"
import html from "@rollup/plugin-html"
import resolve from "@rollup/plugin-node-resolve"
import terser from "@rollup/plugin-terser"
import typescript from "@rollup/plugin-typescript"
import transformInferno from "ts-plugin-inferno"

const prod = process.env.NODE_ENV === "production"

export default {
	input: {
		app: "./src/app.tsx",
		// sw: "./src/sw.ts",
	},
	output: {
		format: "es",
		dir: "./_build",
		sourcemap: true,
		generatedCode: "es2015",
	},
	plugins: [
		resolve(),
		typescript({
			transformers: {
				after: [transformInferno.default()],
			},
		}),
		commonjs(),
		html({ template: generateHtml }),
		prod && terser(),
	],
}

function generateHtml({ files }) {
	const styles = (files.css || []).map(
		({ fileName }) =>
			`<link href="${fileName}" rel="stylesheet" crossorigin>`,
	)

	const scripts = (files.js || []).map(
		({ fileName }) =>
			`<script defer src="${fileName}" crossorigin></script>`,
	)

	const tmpl = [
		"<!DOCTYPE html>",
		"<html>",
		"<head>",
		'<meta charset="utf-8" />',
		'<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />',
		`<title>FeedBox</title>`,
		...styles,
		"</head>",
		"<body>",
		'<div id="app"></div>',
		...scripts,
		"</body>",
		"</html>",
	]
	return tmpl.join("\n")
}
