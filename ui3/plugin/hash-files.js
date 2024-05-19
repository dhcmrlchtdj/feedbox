import * as crypto from "node:crypto"
import * as fs from "node:fs"
import * as path from "node:path"

export function hashFiles(...entries) {
	const files = collect(...entries)
	const digest = files
		.filter(shouldBeHash)
		.sort()
		.reduce((hash, file) => {
			const data = fs.readFileSync(file)
			hash.update(data)
			return hash
		}, crypto.createHash("sha256"))
		.digest("hex")
		.slice(0, 8)
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

function collect(...entries) {
	const files = []
	entries.map((filepath) => {
		const stat = fs.statSync(filepath)
		if (stat.isFile()) {
			files.push(filepath)
		} else if (stat.isDirectory()) {
			const subEntries = fs.readdirSync(filepath, {
				withFileTypes: true,
				recursive: true,
			})
			for (const subEntry of subEntries) {
				if (subEntry.isFile()) {
					files.push(path.join(subEntry.path, subEntry.name))
				}
			}
		}
	})
	return files
}
