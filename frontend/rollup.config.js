import * as fs from 'fs'
import * as path from 'path'
import replace from '@rollup/plugin-replace'
import svelte from 'rollup-plugin-svelte'
import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'

const prod = process.env.NODE_ENV === 'production'

export default [
    {
        input: './src/app.ts',
        output: {
            dir: './_build',
            entryFileNames: '[name].[hash].js',
            format: 'esm',
            sourcemap: true,
        },
        plugins: [
            typescript(),
            nodeResolve(),
            svelte({
                hydratable: true,
                generate: 'dom',
                immutable: true,
                dev: !prod,
            }),
            template([
                {
                    input: './src/template.html',
                    output: './_build/index.html',
                },
            ]),
            prod && terser(),
        ],
    },
    {
        input: './src/sw/index.ts',
        output: {
            dir: './_build',
            entryFileNames: 'sw.js',
            format: 'esm',
            sourcemap: true,
        },
        plugins: [
            replace({
                // TODO: hash(./src/**/*, ./rollup.config, ./tsconfig.json, ./pnpm-lock.yaml)
                __SW_CACHE_VERSION__: JSON.stringify(Date.now().toString()),
            }),
            nodeResolve(),
            typescript(),
            svelte({
                generate: 'ssr',
                immutable: true,
                dev: !prod,
            }),
            prod && terser(),
        ],
    },
]

function template(files) {
    const { mkdir, writeFile, readFile } = fs.promises
    const readStr = async (p) => (await readFile(p)).toString()
    return {
        name: 'template',
        generateBundle: async (_output, bundle) => {
            const entry = Object.values(bundle)
                .filter((b) => b.isEntry)
                .reduce((acc, b) => {
                    acc.push([b.name, b.fileName])
                    return acc
                }, [])

            const replace = (tmpl) => {
                return entry.reduce((acc, [chunkName, fileName]) => {
                    const r = acc.replace(
                        new RegExp(`__${chunkName}__`, 'g'),
                        fileName,
                    )
                    return r
                }, tmpl)
            }

            const tasks = files.map(async (file) => {
                const tmpl = await readStr(file.input)
                const content = replace(tmpl)
                await mkdir(path.dirname(file.output), { recursive: true })
                await writeFile(file.output, content)
            })
            await tasks
        },
    }
}
