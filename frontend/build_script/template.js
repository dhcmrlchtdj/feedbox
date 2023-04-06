import * as fs from "node:fs/promises"
import * as path from "node:path"

export async function template(input, output, pattern) {
	const replace = (tmpl) => {
		return pattern.reduce((content, [fromPattern, toPattern]) => {
			return content.replaceAll(`{{${fromPattern}}}`, toPattern)
		}, tmpl)
	}

	const tmpl = await fs.readFile(input, "utf8")
	const content = replace(tmpl)
	await fs.mkdir(path.dirname(output), { recursive: true })
	await fs.writeFile(output, content)

	return [[input, output]]
}
