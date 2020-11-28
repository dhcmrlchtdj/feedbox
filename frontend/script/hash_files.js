const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')

exports.hashFiles = hashFiles

async function hashFiles(...entries) {
    const files = []

    await Promise.all(
        entries.map(async (filepath) => {
            const stat = await fs.stat(filepath)
            await addEntry(stat, filepath)
        }),
    )

    async function addEntry(entry, filepath) {
        if (entry.isFile()) {
            files.push(filepath)
        } else if (entry.isDirectory()) {
            const subEntries = await fs.readdir(filepath, {
                withFileTypes: true,
            })
            await Promise.all(
                subEntries.map(async (subEntry) => {
                    const name = subEntry.name
                    if (
                        name.startsWith('.') ||
                        name.startsWith('_') ||
                        name.startsWith('node_modules')
                    ) {
                        return
                    }
                    const subFilepath = path.join(filepath, name)
                    await addEntry(subEntry, subFilepath)
                }),
            )
        }
    }

    const digest = await files
        .sort()
        .map((file) => fs.readFile(file))
        .reduce(async (acc, file) => {
            const hash = await acc
            const data = await file
            hash.update(data)
            return hash
        }, crypto.createHash('sha256'))
        .then((hash) => hash.digest('hex'))
        .then((digest) => digest.slice(0, 8))

    return digest
}
