import html from "@rollup/plugin-html"
import resolve from "@rollup/plugin-node-resolve"
import replace from "@rollup/plugin-replace"
import terser from "@rollup/plugin-terser"
import typescript from "@rollup/plugin-typescript"
import transformInferno from "ts-plugin-inferno"
import lightningcss from "./plugin/rollup-plugin-lightningcss.js"

const prod = process.env.NODE_ENV === "production"
const env = Object.entries(process.env).reduce((acc, [k, v]) => {
	acc["process.env." + k] = JSON.stringify(v)
	return acc
}, {})

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
		entryFileNames: "[name]-[hash].js",
		assetFileNames: "[name]-[hash][extname]",
		hashCharacters: "hex",
	},
	plugins: [
		resolve({
			mainFields: prod
				? ["module", "main"]
				: ["dev:module", "module", "main"],
		}),
		replace({
			objectGuards: true,
			preventAssignment: true,
			values: { ...env },
		}),
		lightningcss({
			name: "style.css",
			browserslist: "last 2 versions, not dead",
			minify: prod,
		}),
		typescript({
			transformers: {
				after: [transformInferno.default()],
			},
		}),
		// prod && terser(),
		html({ fileName: "index.html", template: generateHtml }),
		html({ fileName: "index.html.json", template: generateHtmlJson }),
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

function generateHtmlJson({ files }) {
	const styles = (files.css || []).map(
		({ fileName }) => `<${fileName}>; rel=preload; as=style; crossorigin`,
	)

	const scripts = (files.js || []).map(
		({ fileName }) => `<${fileName}>; rel=preload; as=script; crossorigin`,
	)

	return JSON.stringify(
		{
			header: [
				{
					key: "Link",
					value: [...scripts, ...styles].join(", "),
				},
			],
		},
		null,
		4,
	)
}
