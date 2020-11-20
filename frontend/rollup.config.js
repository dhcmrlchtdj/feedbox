import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
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
            dir: './_build/',
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
            dir: './_build/',
            entryFileNames: 'sw.js',
            format: 'esm',
            sourcemap: true,
        },
        plugins: [
            replace({
                __STATIC_VERSION__: JSON.stringify(hashDir()),
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

function hashDir() {
    const files = []
    const next = [['.', fs.readdirSync('.', { withFileTypes: true })]]
    while (next.length > 0) {
        const [parent, curr] = next.pop()
        curr.forEach((f) => {
            const name = f.name
            if (
                name.startsWith('.') ||
                name.startsWith('_') ||
                name.startsWith('node_modules')
            )
                return
            const filepath = path.join(parent, name)
            if (f.isFile()) {
                files.push(filepath)
            } else if (f.isDirectory()) {
                next.push([
                    filepath,
                    fs.readdirSync(filepath, { withFileTypes: true }),
                ])
            }
        })
    }

    const hash = crypto.createHash('sha256')
    files.sort().forEach((file) => {
        const data = fs.readFileSync(file)
        hash.update(data)
    })
    const digest = hash.digest('hex')

    return digest.slice(0, 16)
}
