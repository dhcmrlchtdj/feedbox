import fs from 'fs/promises'
import path from 'path'
import { transformAsync } from '@babel/core'
import presetSolid from 'babel-preset-solid'
import presetTypescript from '@babel/preset-typescript'

const defaultOpts = {
    hydratable: false,
    generate: 'dom', // "ssr"
}

export function solidPlugin(opts = defaultOpts) {
    return {
        name: 'solid',
        setup(build) {
            build.onLoad({ filter: /\.(t|j)sx$/ }, async (args) => {
                const source = await fs.readFile(args.path, 'utf8')
                const filename = path.resolve(process.cwd(), args.path)

                const { code } = await transformAsync(source, {
                    presets: [[presetSolid, opts], presetTypescript],
                    filename,
                    sourceMaps: 'inline',
                })

                return {
                    contents: code,
                    loader: 'js',
                    resolveDir: path.dirname(filename),
                }
            })
        },
    }
}
