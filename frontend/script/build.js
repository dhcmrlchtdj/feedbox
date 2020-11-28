// https://esbuild.github.io/api/#build-api
// https://esbuild.github.io/plugins/#svelte-plugin

const path = require('path')
const esbuild = require('esbuild')
const { hashFiles } = require('./hash_files')
const { sveltePlugin } = require('./svelte_plugin')
const { template } = require('./template')
const r = (p) => path.relative(process.cwd(), path.resolve(__dirname, p))

main()

async function main() {
    const prod = process.env.NODE_ENV === 'production'

    const hash = await hashFiles(r('.'), r('../src'), r('../pnpm-lock.yaml'))

    await Promise.all([
        build(
            r('../src/app.ts'),
            r(`../_build/app.${hash}.js`),
            { minify: prod },
            { generate: 'dom', hydratable: true, dev: !prod },
        ),
        build(
            r('../src/sw/index.ts'),
            r('../_build/sw.js'),
            {
                minify: prod,
                define: { __STATIC_VERSION__: JSON.stringify(hash) },
            },
            { generate: 'ssr', dev: !prod },
        ),
        template(r('../src/template.html'), r('../_build/index.html'), [
            ['./app.js', `./app.${hash}.js`],
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
        .then(() => {
            console.log(`${input} => ${output}`)
        })
}
