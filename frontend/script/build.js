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

    const esbuildOpts = {
        metafile: true,
        bundle: true,
        format: 'esm',
        target: 'es2020',
        platform: 'browser',
        sourcemap: true,
        minify: prod,
        outdir: r(`../_build/`),
    }

    const buildApp = async () => {
        return esbuild
            .build({
                ...esbuildOpts,
                define: env,
                plugins: [
                    sveltePlugin({
                        generate: 'dom',
                        hydratable: true,
                        dev: !prod,
                    }),
                ],
                entryPoints: [r('../src/app.ts')],
                entryNames: '[name]-[hash]',
            })
            .then(normalizeResult)
    }
    const buildServiceWorker = async () => {
        const hashStatic = await hashFiles(
            r('./'),
            r('../src/'),
            r('../pnpm-lock.yaml'),
        )
        const hashAPI = await hashFiles(
            r('../../server/'),
            r('../../internal/'),
            r('../../go.sum'),
        )

        return esbuild
            .build({
                ...esbuildOpts,
                define: {
                    ...env,
                    __STATIC_VERSION__: JSON.stringify(hashStatic),
                    __API_VERSION__: JSON.stringify(hashAPI),
                },
                plugins: [sveltePlugin({ generate: 'ssr', dev: !prod })],
                entryPoints: [r('../src/sw/index.ts')],
                entryNames: 'sw',
            })
            .then(normalizeResult)
    }

    await Promise.all([
        buildApp().then(logResult).then(buildHtml),
        buildServiceWorker().then(logResult),
    ])
}

function normalizeResult(r) {
    const result = Object.entries(r?.metafile?.outputs ?? {})
        .filter(([out, meta]) => Boolean(meta.entryPoint))
        .map(([out, meta]) => [meta.entryPoint, out])
    return result
}

function logResult(result) {
    result.forEach(([i, o]) => console.log(`${i} => ${o}`))
    return result
}

function buildHtml(pattern) {
    return template(
        r('../src/template.html'),
        r('../_build/index.html'),
        pattern.map(([input, output]) => [
            input.replace('src', '.'),
            output.replace('_build', '.'),
        ]),
    )
}
