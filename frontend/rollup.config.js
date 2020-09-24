import * as path from 'path'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import svelte from 'rollup-plugin-svelte'
import { terser } from 'rollup-plugin-terser'
import { manifest } from './rollup-plugin/manifest'
import { template } from './rollup-plugin/template'

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
            manifest('./_build/manifest.json'),
            template({
                manifest: './_build/manifest.json',
                files: {
                    './src/template.html': './_build/index.html',
                },
            }),
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
            nodeResolve(),
            typescript(),
            json(),
            svelte({
                generate: 'ssr',
                immutable: true,
                dev: !prod,
            }),
            prod && terser(),
        ],
    },
]
