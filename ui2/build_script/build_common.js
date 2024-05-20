// https://esbuild.github.io/api/#build-api

import * as esbuild from "esbuild"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as url from "node:url"
import { hashFiles } from "./hash_files.js"
import { template } from "./template.js"

const r = (p) =>
	path.relative(process.cwd(), url.fileURLToPath(new URL(p, import.meta.url)))

const prod = process.env.NODE_ENV === "production"

const env = Object.entries(process.env).reduce((acc, [k, v]) => {
	acc["process.env." + k] = JSON.stringify(v)
	return acc
}, {})

const esbuildOpts = {
	platform: "browser",
	metafile: true,
	bundle: true,
	format: "esm",
	target: "esnext",
	sourcemap: "inline",
	minify: prod,
	outdir: r(`../_build/`),
	jsxDev: !prod,
	jsx: "automatic",
}

export async function buildApp(enableWatch = false) {
	const opt = {
		...esbuildOpts,
		define: env,
		plugins: [afterBuild({ buildHtml: true, copyStatic: true })],
		entryPoints: [r("../src/app.tsx")],
		entryNames: "[name]-[hash]",
	}

	if (enableWatch) {
		return (await esbuild.context(opt)).watch()
	} else {
		return esbuild.build(opt)
	}
}

export async function buildServiceWorker(enableWatch = false) {
	const hashStatic = await hashFiles(
		r("./"),
		r("../src/"),
		r("../package.json"),
		r("../pnpm-lock.yaml"),
	)
	const hashAPI = await hashFiles(
		r("../../server/"),
		r("../../internal/"),
		r("../../go.mod"),
		r("../../go.sum"),
	)

	const opt = {
		...esbuildOpts,
		define: {
			...env,
			__STATIC_VERSION__: JSON.stringify(hashStatic),
			__API_VERSION__: JSON.stringify(hashAPI),
		},
		plugins: [afterBuild({ buildHtml: false, copyStatic: false })],
		entryPoints: [r("../src/sw/index.tsx")],
		entryNames: "sw",
	}

	if (enableWatch) {
		return (await esbuild.context(opt)).watch()
	} else {
		return esbuild.build(opt)
	}
}

function afterBuild(opts) {
	return {
		name: "afterBuild",
		setup(build) {
			build.onEnd(async (result) => {
				const r = (
					await Promise.all([
						extractInputOutput(result),
						opts.copyStatic ? copyStatic() : [],
					])
				).flat()
				printInputOutput(r)
				if (opts.buildHtml) await buildHtml(r)
			})
		},
	}
}

async function copyStatic() {
	return (await Promise.all([copyStaticDir(), copyWebManifest()])).flat()
}

async function copyStaticDir() {
	const result = []
	await fs.cp(r("../src/static/"), r("../_build/"), {
		recursive: true,
		mode: fs.constants.COPYFILE_FICLONE,
		filter: (i, o) => {
			if (o !== "_build") result.push([i, o])
			return true
		},
	})
	return result
}

async function copyWebManifest() {
	const input = r("../src/manifest.webmanifest")
	const hash = await hashFiles(input)
	const output = r(`../_build/${hash}.webmanifest`)
	await fs.copyFile(input, output, fs.constants.COPYFILE_FICLONE)
	return [[input, output]]
}

function buildHtml(pattern) {
	const replace = pattern.map(([input, output]) => [
		input.replace("src", "."),
		output.replace("_build", "."),
	])
	return Promise.all([
		template(
			r("../src/template.html"),
			r("../_build/index.html"),
			replace,
		).then(printInputOutput),
		template(
			r("../src/template.html.json"),
			r("../_build/index.html.json"),
			replace,
		).then(printInputOutput),
	])
}

async function extractInputOutput(result) {
	const metafile = result?.metafile
	if (!metafile) return []

	const generated = metafile.outputs
	const inputOutputTask = Object.entries(generated)
		.filter(([_, meta]) => Boolean(meta.entryPoint))
		.map(async ([out, meta]) => {
			const fileMap = []

			const sourceFile = meta.entryPoint
			const jsFile = out
			const cssFile = meta.cssBundle
			const metaFile = out + ".meta.json"

			fileMap.push([sourceFile, jsFile])
			if (generated[jsFile + ".map"]) {
				fileMap.push([sourceFile + ".map", jsFile + ".map"])
			}
			if (generated[jsFile + ".LEGAL.txt"]) {
				fileMap.push([sourceFile + ".LEGAL.txt", jsFile + ".LEGAL.txt"])
			}

			if (cssFile) {
				fileMap.push([sourceFile + ".css", cssFile])
				if (generated[cssFile + ".map"]) {
					fileMap.push([sourceFile + ".css.map", cssFile + ".map"])
				}
				if (generated[cssFile + ".LEGAL.txt"]) {
					fileMap.push([
						sourceFile + ".css.LEGAL.txt",
						cssFile + ".LEGAL.txt",
					])
				}
			}

			await fs.writeFile(metaFile, JSON.stringify(metafile, null, 4))
			fileMap.push([sourceFile + ".meta.json", metaFile])

			return fileMap
		})
	const inputOutput = (await Promise.all(inputOutputTask)).flat()

	return inputOutput
}

function printInputOutput(result) {
	result.forEach(([i, o]) => console.log(`${i} -> ${o}`))
	return result
}
