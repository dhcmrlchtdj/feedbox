import html from "@rollup/plugin-html"
import resolve from "@rollup/plugin-node-resolve"
import replace from "@rollup/plugin-replace"
import terser from "@rollup/plugin-terser"
import typescript from "@rollup/plugin-typescript"
import * as path from "node:path"
import * as url from "node:url"
import transformInferno from "ts-plugin-inferno"
import { hashFiles } from "./plugin/hash-files.js"
import lightningcss from "./plugin/rollup-plugin-lightningcss.js"

const prod = process.env.NODE_ENV === "production"
const isSW = process.env.IS_SW === "true"
const env = Object.entries(process.env).reduce((acc, [k, v]) => {
	acc["process.env." + k] = JSON.stringify(v)
	return acc
}, {})

const r = (p) =>
	path.relative(process.cwd(), url.fileURLToPath(new URL(p, import.meta.url)))
const hashStatic = hashFiles(
	r("./src/"),
	r("./package.json"),
	r("./pnpm-lock.yaml"),
)
const hashAPI = hashFiles(
	r("../server/"),
	r("../internal/"),
	r("../go.mod"),
	r("../go.sum"),
)

export default {
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
			values: {
				...env,
				__STATIC_VERSION__: JSON.stringify(hashStatic),
				__API_VERSION__: JSON.stringify(hashAPI),
			},
		}),
		!isSW && lightningcss({
			name: "style.css",
			browserslist: "last 2 versions, not dead",
			minify: prod,
		}),
		typescript({
			transformers: {
				after: [transformInferno.default()],
			},
		}),
		prod && terser(),
		!isSW && html({ fileName: "index.html", template: generateHtml }),
		!isSW && html({ fileName: "index.html.json", template: generateHtmlJson }),
	],
}

function generateHtml({ files }) {
	const styles = (files.css || []).map(
		({ fileName }) =>
			`<link href="${fileName}" rel="stylesheet" crossorigin>`,
	)

	const scripts = (files.js || []).map(({ fileName }) => {
		if (fileName.startsWith("sw-")) return ""
		return `<script defer src="${fileName}" crossorigin></script>`
	})

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
	return tmpl.filter(Boolean).join("\n")
}

function generateHtmlJson({ files }) {
	const styles = (files.css || []).map(
		({ fileName }) => `<${fileName}>; rel=preload; as=style; crossorigin`,
	)

	const scripts = (files.js || []).map(({ fileName }) => {
		if (fileName.startsWith("sw-")) return ""
		return `<${fileName}>; rel=preload; as=script; crossorigin`
	})

	return JSON.stringify(
		{
			header: [
				{
					key: "Link",
					value: [...scripts, ...styles].filter(Boolean).join(", "),
				},
			],
		},
		null,
		4,
	)
}
