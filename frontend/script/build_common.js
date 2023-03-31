// https://esbuild.github.io/api/#build-api

import path from "path"
import esbuild from "esbuild"
import { hashFiles } from "./hash_files.js"
import { sveltePlugin } from "./svelte_plugin.js"
import { template } from "./template.js"

const r = (p) =>
	path.relative(process.cwd(), new URL(p, import.meta.url).pathname)

const prod = process.env.NODE_ENV === "production"

const env = Object.entries(process.env).reduce((acc, [k, v]) => {
	acc["process.env." + k] = JSON.stringify(v)
	return acc
}, {})

const esbuildOpts = {
	legalComments: "none",
	metafile: true,
	bundle: true,
	format: "esm",
	target: "esnext",
	platform: "browser",
	sourcemap: true,
	minify: prod,
	outdir: r(`../_build/`),
}

const rebuildPlugin = {
	name: "rebuild",
	setup(build) {
		build.onEnd((result) => {
			const r = normalizeResult(result)
			logResult(r)
			buildHtml(r)
		})
	},
}

export async function buildApp(enableWatch = false) {
	const opt = {
		...esbuildOpts,
		define: env,
		plugins: [
			sveltePlugin({
				generate: "dom",
				hydratable: true,
				dev: !prod,
			}),
			enableWatch && rebuildPlugin,
		].filter(Boolean),
		entryPoints: [r("../src/app.ts")],
		entryNames: "[name]-[hash]",
	}

	if (enableWatch) {
		return (await esbuild.context(opt)).watch()
	} else {
		return esbuild
			.build(opt)
			.then(normalizeResult)
			.then(logResult)
			.then(buildHtml)
	}
}

export async function buildServiceWorker(enableWatch = false) {
	const hashStatic = await hashFiles(
		r("./"),
		r("../src/"),
		r("../pnpm-lock.yaml"),
	)
	const hashAPI = await hashFiles(
		r("../../server/"),
		r("../../internal/"),
		r("../../go.sum"),
	)

	const opt = {
		...esbuildOpts,
		define: {
			...env,
			__STATIC_VERSION__: JSON.stringify(hashStatic),
			__API_VERSION__: JSON.stringify(hashAPI),
		},
		plugins: [
			sveltePlugin({ generate: "ssr", dev: !prod }),
			enableWatch && rebuildPlugin,
		].filter(Boolean),
		entryPoints: [r("../src/sw/index.ts")],
		entryNames: "sw",
	}

	if (enableWatch) {
		return (await esbuild.context(opt)).watch()
	} else {
		return esbuild.build(opt).then(normalizeResult).then(logResult)
	}
}

function buildHtml(pattern) {
	return Promise.all([
		template(
			r("../src/template.html"),
			r("../_build/index.html"),
			pattern.map(([input, output]) => [
				input.replace("src", "."),
				output.replace("_build", "."),
			]),
		).then(logResult),
		template(
			r("../src/template.html.json"),
			r("../_build/index.html.json"),
			pattern.map(([input, output]) => [
				input.replace("src", "."),
				output.replace("_build", "."),
			]),
		).then(logResult),
	])
}

function normalizeResult(r) {
	const result = Object.entries(r?.metafile?.outputs ?? {})
		.filter(([out, meta]) => Boolean(meta.entryPoint))
		.map(([out, meta]) => [meta.entryPoint, out])
	return result
}

function logResult(result) {
	result.forEach(([i, o]) => console.log(`${i} -> ${o}`))
	return result
}
