// https://esbuild.github.io/plugins/#svelte-plugin
// https://svelte.dev/docs#svelte_compile
// https://github.com/EMH333/esbuild-svelte

import * as esbuild from "esbuild"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as svelte from "svelte/compiler"

const defaultOpts = {
	dev: false,
	generate: "dom",
	hydratable: false,
	immutable: true,
	css: "injected",
	discloseVersion: false,
}

const styleRe = new RegExp(
	[
		/export/,
		/\s+/,
		/const/,
		/\s+/,
		/\$\$style/,
		/\s+/,
		/=/,
		/\s+/,
		/`(((?:\\`)|[^`])*)`/,
		/\s*/,
		/;?/,
	]
		.map((x) => x.source)
		.join(""),
	"m",
)

const templateRe = new RegExp(
	[
		/export/,
		/\s+/,
		/const/,
		/\s+/,
		/\$\$template/,
		/\s+/,
		/=/,
		/\s+/,
		/`(((?:\\`)|[^`])*)`/,
		/\s*/,
		/;?/,
	]
		.map((x) => x.source)
		.join(""),
	"m",
)

export function sveltePlugin(opts) {
	return {
		name: "svelte",
		setup(build) {
			const cssCode = new Map()

			build.onLoad({ filter: /\.svelte\.ts$/ }, async (args) => {
				const filename = path.resolve(process.cwd(), args.path)
				const source = await fs.readFile(args.path, "utf8")
				const sfc = await preprocess(source)

				const svelteOpts = { ...defaultOpts, ...opts, filename }

				const convert = convertMessage(sfc, filename)
				try {
					const { js, css, warnings } = svelte.compile(
						sfc,
						svelteOpts,
					)
					let contents =
						js.code + "//# sourceMappingURL=" + js.map.toUrl()
					if (css && css.code) {
						const cssPath = filename + ".svelte-css"
						const cssContent = [
							css.code,
							`/*# sourceMappingURL=${css.map.toUrl()} */`,
						].join("\n")
						cssCode.set(cssPath, cssContent)
						contents = `import "${cssPath}";\n${contents}`
					}
					return {
						contents,
						warnings: warnings.map(convert),
						loader: "js",
						resolveDir: path.dirname(filename),
					}
				} catch (e) {
					return { errors: [convert(e)] }
				}
			})

			build.onResolve({ filter: /\.svelte-css$/ }, (args) => {
				return { path: args.path, namespace: "virtual" }
			})
			build.onLoad(
				{ filter: /\.svelte-css$/, namespace: "virtual" },
				(args) => {
					const css = cssCode.get(args.path)
					if (css) {
						return {
							contents: css,
							loader: "css",
							resolveDir: path.dirname(args.path),
						}
					} else {
						return null
					}
				},
			)
		},
	}
}

function convertMessage(source, filename) {
	return ({ message, start, end }) => {
		let location
		if (start && end) {
			const lineText = source.split(/\r\n|\r|\n/g)[start.line - 1]
			const lineEnd =
				start.line === end.line ? end.column : lineText.length
			location = {
				file: filename,
				line: start.line,
				column: start.column,
				length: lineEnd - start.column,
				lineText,
			}
		}
		return { text: message, location }
	}
}

async function preprocess(source) {
	let templateContent = ""
	let styleContent = ""
	let script = source

	const style = styleRe.exec(source)
	if (style) {
		styleContent = style[1].trim()
		script = script.replace(style[0], "")
	}

	const template = templateRe.exec(source)
	if (template) {
		templateContent = template[1].trim()
		script = script.replace(template[0], "")
	}

	const r = await esbuild.transform(script, {
		loader: "ts",
		tsconfigRaw: {
			compilerOptions: {
				verbatimModuleSyntax: true,
			},
		},
	})

	const sfc = [
		"<style>",
		styleContent,
		"</style>",
		"",
		"<script>",
		r.code,
		"</script>",
		"",
		templateContent,
	].join("\n")

	return sfc
}
