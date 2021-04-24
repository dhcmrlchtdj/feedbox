// https://esbuild.github.io/api/#build-api

import path from 'path'
import esbuild from 'esbuild'
import { hashFiles } from './hash_files.js'
import { sveltePlugin } from './svelte_plugin.js'
import { template } from './template.js'

const r = (p) =>
    path.relative(process.cwd(), new URL(p, import.meta.url).pathname)

main()

async function main() {
    const env = Object.entries(process.env).reduce((acc, [k, v]) => {
        acc['process.env.' + k] = JSON.stringify(v)
        return acc
    }, {})
    const prod = process.env.NODE_ENV === 'production'

    const hashStatic = await hashFiles(r('.'), r('../src'), r('../pnpm-lock.yaml'))
    const hashAPI = await hashFiles(r('../../server', '../../internal', '../../go.sum'))

    await Promise.all([
        build(
            r('../src/app.ts'),
            r(`../_build/app.${hashStatic}.js`),
            { minify: prod, define: env },
            { generate: 'dom', hydratable: true, dev: !prod },
        ),
        build(
            r('../src/sw/index.ts'),
            r('../_build/sw.js'),
            {
                minify: prod,
                define: {
                    ...env,
                    __API_VERSION__: JSON.stringify(hashAPI),
                    __STATIC_VERSION__: JSON.stringify(hashStatic),
                },
            },
            { generate: 'ssr', dev: !prod },
        ),
        template(r('../src/template.html'), r('../_build/index.html'), [
            ['./app.ts', `./app.${hashStatic}.js`],
        ]),
    ])
}

function build(input, output, esbuildOpts, svelteOpts) {
    return esbuild
        .build({
            bundle: true,
            format: 'esm',
            target: 'es2020',
            platform: 'browser',
            minify: true,
            sourcemap: true,
            ...esbuildOpts,
            plugins: [sveltePlugin(svelteOpts)],
            entryPoints: [input],
            outfile: output,
        })
        .then(() => console.log(`${input} => ${output}`))
}
