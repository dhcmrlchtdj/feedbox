import * as crypto from "node:crypto"
import * as fs from "node:fs/promises"
import * as path from "node:path"

export async function hashFiles(...entries) {
	const files = await collect(...entries)
	const digest = await files
		.filter(shouldBeHash)
		.sort()
		.reduce(async (acc, file) => {
			const hash = await acc
			const data = await fs.readFile(file)
			hash.update(data)
			return hash
		}, crypto.createHash("sha256"))
		.then((hash) => hash.digest("hex"))
		.then((digest) => digest.slice(0, 8))

	return digest
}

function shouldBeHash(filename) {
	const shouldBeIgnore =
		filename.includes("/.") ||
		filename.includes("/_") ||
		filename.includes("target/") ||
		filename.includes("node_modules/")
	return !shouldBeIgnore
}

async function collect(...entries) {
	const files = []
	await Promise.all(
		entries.map(async (filepath) => {
			const stat = await fs.stat(filepath)
			if (stat.isFile()) {
				files.push(filepath)
			} else if (stat.isDirectory()) {
				const subEntries = await fs.readdir(filepath, {
					withFileTypes: true,
					recursive: true,
				})
				for (const subEntry of subEntries) {
					if (subEntry.isFile()) {
						files.push(path.join(subEntry.path, subEntry.name))
					}
				}
			}
		}),
	)
	return files
}
