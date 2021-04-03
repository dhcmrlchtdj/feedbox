// https://esbuild.github.io/api/#build-api

const path = require('path')
const esbuild = require('esbuild')
const { hashFiles } = require('./util/hash_files')
const { sveltePlugin } = require('./util/svelte_plugin')
const { template } = require('./util/template')
const r = (p) => path.relative(process.cwd(), path.resolve(__dirname, p))

exports.build = build

async function build(enableWatch = false) {
    const env = Object.entries(process.env).reduce((acc, [k, v]) => {
        acc['process.env.' + k] = JSON.stringify(v)
        return acc
    }, {})
    const prod = process.env.NODE_ENV === 'production'

    const hash = await hashFiles(r('.'), r('../src'), r('../pnpm-lock.yaml'))

    const esbuildOpts = {
        metafile: true,
        bundle: true,
        format: 'esm',
        target: 'es2020',
        platform: 'browser',
        sourcemap: true,
        minify: prod,
        define: env,
        outdir: r(`../_build/`),
        watch: enableWatch && {
            onRebuild(error, result) {
                if (error) console.error('watch build failed:', error)
                const r = normalizeResult(result)
                r.forEach(([i, o]) => console.log(`${i} => ${o}`))
            },
        },
    }

    await Promise.all([
        esbuild
            .build({
                ...esbuildOpts,
                plugins: [
                    sveltePlugin({
                        generate: 'dom',
                        hydratable: true,
                        dev: !prod,
                    }),
                ],
                entryPoints: [r('../src/app.ts')],
                entryNames: '[name]-[hash]',
                watch: enableWatch && {
                    async onRebuild(error, result) {
                        if (error) console.error('watch build failed:', error)
                        const r = logResult(result)
                        await buildHtml(r)
                    },
                },
            })
            .then(async (result) => {
                const r = logResult(result)
                await buildHtml(r)
            }),
        esbuild
            .build({
                ...esbuildOpts,
                define: { ...env, __STATIC_VERSION__: JSON.stringify(hash) },
                plugins: [sveltePlugin({ generate: 'ssr', dev: !prod })],
                entryPoints: [r('../src/sw/index.ts')],
                entryNames: 'sw',
                watch: enableWatch && {
                    onRebuild(error, result) {
                        if (error) console.error('watch build failed:', error)
                        logResult(result)
                    },
                },
            })
            .then(logResult),
    ])
}

function buildHtml(meta) {
    return template(
        r('../src/template.html'),
        r('../_build/index.html'),
        meta.map(([i, o]) => [i.replace('src', '.'), o.replace('_build', '.')]),
    )
}

function logResult(r) {
    const result = Object.entries(r.metafile?.outputs ?? {})
        .filter(([out, meta]) => Boolean(meta.entryPoint))
        .map(([out, meta]) => [meta.entryPoint, out])
    result.forEach(([i, o]) => console.log(`${i} => ${o}`))
    return result
}
