// https://esbuild.github.io/plugins/#svelte-plugin
// https://svelte.dev/docs#svelte_compile

import fs from 'fs/promises'
import path from 'path'
import * as svelte from 'svelte/compiler'

const defaultOpts = {
    dev: false,
    generate: 'dom',
    hydratable: false,
    immutable: true,
    css: false,
    format: 'esm',
}

export function sveltePlugin(opts) {
    return {
        name: 'svelte',
        setup(build) {
            build.onLoad({ filter: /\.html$/ }, async (args) => {
                const source = await fs.readFile(args.path, 'utf8')
                const filename = path.resolve(process.cwd(), args.path)
                const svelteOpts = { ...defaultOpts, ...opts, filename }

                const convert = convertMessage(source, filename)
                try {
                    const { js, warnings } = svelte.compile(source, svelteOpts)
                    let contents =
                        js.code + `//# sourceMappingURL=` + js.map.toUrl()
                    return {
                        contents,
                        warnings: warnings.map(convert),
                        loader: 'js',
                        resolveDir: path.dirname(filename),
                    }
                } catch (e) {
                    return { errors: [convert(e)] }
                }
            })
        },
    }
}

function convertMessage(source, filename) {
    return ({ message, start, end }) => {
        let location
        if (start && end) {
            const lineText = source.split(/\r\n|\r|\n/g)[start.line - 1]
            const lineEnd =
                start.line === end.line ? end.column : lineText.length
            location = {
                file: filename,
                line: start.line,
                column: start.column,
                length: lineEnd - start.column,
                lineText,
            }
        }
        return { text: message, location }
    }
}
