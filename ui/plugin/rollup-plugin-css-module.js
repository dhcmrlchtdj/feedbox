import { createFilter } from "@rollup/pluginutils"
import { bundle, transform } from "lightningcss"

let { code, map, exports } = transform({
	filename: "style.css",
	code: Buffer.from(".foo { color: red }"),
	minify: true,
	sourceMap: true,
})

export function cssModule(options = {}) {
	const filter = createFilter(
		options.include || ["**/*.module.css"],
		options.exclude,
	)
	return {
		name: "css-module",
		resolveId(source) {
			if (source === "virtual-module") {
				// this signals that Rollup should not ask other plugins or check
				// the file system to find this id
				return source
			}
			return null // other ids should be handled as usually
		},
		load(id) {
			if (id === "virtual-module") {
				// the source code for "virtual-module"
				return 'export default "This is virtual!"'
			}
			return null // other ids should be handled as usually
		},
	}
}
