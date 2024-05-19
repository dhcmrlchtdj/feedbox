import { createFilter } from "@rollup/pluginutils"
import browserslist from "browserslist"
import { browserslistToTargets, transform } from "lightningcss"

export default function css(options = {}) {
	const enc = new TextEncoder()
	const dec = new TextDecoder()
	const cache = {}

	const filter = createFilter(
		options.include ?? ["**/*.css"],
		options.exclude,
	)

	return {
		name: "lightningcss",
		version: "0.0.1",

		transform(source, id) {
			if (!filter(id)) return

			const isCssModule = id.endsWith(".module.css")

			const result = transform({
				filename: id,
				code: enc.encode(source),
				cssModules: isCssModule,
				minify: options.minify ?? false,
				targets: browserslistToTargets(
					browserslist(options.browserslist),
				),
				sourceMap: false,
			})

			const css = dec.decode(result.code)
			cache[id] = css

			const code = isCssModule
				? Object.entries(result.exports)
						.map(
							([key, val]) =>
								`export const ${key} = "${val.name}";`,
						)
						.join("\n")
				: ""

			return { code, map: null }
		},

		async generateBundle(opts, bundle) {
			const css = Object.values(cache).join("\n")
			this.emitFile({
				type: "asset",
				name: options.name ?? "style.css",
				source: css,
			})
		},
	}
}
