// https://esbuild.github.io/api/#build-api
// https://esbuild.github.io/plugins/#svelte-plugin

const path = require('path')
const esbuild = require('esbuild')
const { hashFiles } = require('./hash_files')
const { sveltePlugin } = require('./svelte_plugin')
const { template } = require('./template')

const prod = process.env.NODE_ENV === 'production'
const r = (p) => path.resolve(__dirname, p)

const hash = hashFiles(r('.'), r('../src'), r('../pnpm-lock.yaml'))

build(r('../src/app.ts'), r(`../_build/app.${hash}.js`), 'dom')
build(r('../src/sw/index.ts'), r('../_build/sw.js'), 'ssr')
template(r('../src/template.html'), r('../_build/index.html'), [
    ['./app.js', `./app.${hash}.js`],
])

function build(input, output, generate) {
    esbuild
        .build({
            bundle: true,
            format: 'esm',
            target: 'es2020',
            platform: 'browser',
            minify: prod,
            sourcemap: true,
            define: {
                __STATIC_VERSION__: JSON.stringify(hash),
            },
            plugins: [sveltePlugin(generate)],
            entryPoints: [input],
            outfile: output,
        })
        .then(() => {
            const f = path.relative(process.cwd(), input)
            const t = path.relative(process.cwd(), output)
            console.log(`${f} => ${t}`)
        })
        .catch((e) => {
            console.log(e)
            process.exit(1)
        })
}
