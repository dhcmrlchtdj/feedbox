const fs = require('fs')
const path = require('path')

const { mkdir, writeFile } = fs.promises

exports.manifest = opt => {
    return {
        name: 'manifest',
        generateBundle: async (options, bundle, isWrite) => {
            const manifest = Object.keys(bundle).reduce(
                (acc, key) => {
                    const entry = bundle[key]
                    acc.bundle.push(entry.fileName)
                    if (entry.isEntry) {
                        acc.entry[entry.name] = entry.fileName
                    } else if (entry.isAsset) {
                        acc.asset.push(entry.fileName)
                    } else {
                        acc.chunk.push(entry.fileName)
                    }
                    return acc
                },
                { bundle: [], entry: {}, chunk: [], asset: [] },
            )
            const json = JSON.stringify(manifest, null, 4)
            await mkdir(path.dirname(opt), { recursive: true })
            await writeFile(opt, json)
        },
    }
}
