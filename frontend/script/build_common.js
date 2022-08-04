// https://esbuild.github.io/api/#build-api

import path from 'path'
import esbuild from 'esbuild'
import { hashFiles } from './hash_files.js'
import { solidPlugin } from './solid_plugin.js'
import { template } from './template.js'

const r = (p) =>
    path.relative(process.cwd(), new URL(p, import.meta.url).pathname)

const prod = process.env.NODE_ENV === 'production'

const env = Object.entries(process.env).reduce((acc, [k, v]) => {
    acc['process.env.' + k] = JSON.stringify(v)
    return acc
}, {})

const esbuildOpts = {
    legalComments: 'linked',
    metafile: true,
    bundle: true,
    format: 'esm',
    target: 'es2020',
    platform: 'browser',
    sourcemap: true,
    minify: prod,
    outdir: r(`../_build/`),
}

export async function buildApp(enableWatch = false) {
    return esbuild
        .build({
            ...esbuildOpts,
            define: env,
            plugins: [
                solidPlugin({
                    hydratable: true,
                    generate: 'dom',
                }),
            ],
            entryPoints: [r('../src/app.ts')],
            entryNames: '[name]-[hash]',
            watch: enableWatch && {
                onRebuild(error, result) {
                    if (error) console.error('watch build failed:', error)
                    const r = normalizeResult(result)
                    logResult(r)
                    buildHtml(r)
                },
            },
        })
        .then(normalizeResult)
        .then(logResult)
        .then(buildHtml)
}

export async function buildServiceWorker(enableWatch = false) {
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
            plugins: [
                solidPlugin({
                    hydratable: true,
                    generate: 'ssr',
                }),
            ],
            entryPoints: [r('../src/sw/index.ts')],
            entryNames: 'sw',
            watch: enableWatch && {
                onRebuild(error, result) {
                    if (error) console.error('watch build failed:', error)
                    logResult(normalizeResult(result))
                },
            },
        })
        .then(normalizeResult)
        .then(logResult)
}

function buildHtml(pattern) {
    return template(
        r('../src/template.html'),
        r('../_build/index.html'),
        pattern.map(([input, output]) => [
            input.replace('src', '.'),
            output.replace('_build', '.'),
        ]),
    ).then(logResult)
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
