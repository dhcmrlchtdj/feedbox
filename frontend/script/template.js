import fs from "fs/promises"
import path from "path"

export async function template(input, output, pattern) {
	const replace = (tmpl) => {
		pattern.sort(([f1], [f2]) => f2.length - f1.length)
		return pattern.reduce((content, [fromPattern, toPattern]) => {
			return content.replaceAll(fromPattern, toPattern)
		}, tmpl)
	}

	const tmpl = await fs.readFile(input, "utf8")
	const content = replace(tmpl)
	await fs.mkdir(path.dirname(output), { recursive: true })
	await fs.writeFile(output, content)

	return [[input, output]]
}
