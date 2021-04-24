import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'

const pMap = (arr, fn) => Promise.all(arr.map(fn))

export async function hashFiles(...entries) {
    const files = []
    await pMap(entries, async (filepath) => {
        const stat = await fs.stat(filepath)
        return addEntry(files, stat, filepath)
    })

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

async function addEntry(output, entry, filepath) {
    if (entry.isFile()) {
        output.push(filepath)
    } else if (entry.isDirectory()) {
        const subEntries = await fs.readdir(filepath, {
            withFileTypes: true,
        })
        return pMap(subEntries, (subEntry) => {
            const name = subEntry.name
            if (
                name.startsWith('.') ||
                name.startsWith('_') ||
                name.startsWith('node_modules') ||
                name.endsWith('_test.go')
            ) {
                return
            }
            const subFilepath = path.join(filepath, name)
            return addEntry(output, subEntry, subFilepath)
        })
    }
}
