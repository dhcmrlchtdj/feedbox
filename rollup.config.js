import * as path from 'path'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import svelte from 'rollup-plugin-svelte'
import { terser } from 'rollup-plugin-terser'
import { dotenv } from './rollup-plugin/dotenv'
import { manifest } from './rollup-plugin/manifest'
import { template } from './rollup-plugin/template'

const prod = process.env.NODE_ENV === 'production'

export default [
    {
        input: './static/app.ts',
        output: {
            dir: './_build/static',
            entryFileNames: '[name].[hash].js',
            format: 'esm',
            sourcemap: true,
        },
        plugins: [
            resolve(),
            typescript(),
            dotenv({
                path: path.resolve(__dirname, './dotenv'),
                example: path.resolve(__dirname, './dotenv.example'),
            }),
            svelte({
                hydratable: true,
                generate: 'dom',
                immutable: true,
                dev: !prod,
            }),
            manifest('./_build/static/manifest.json'),
            template({
                manifest: './_build/static/manifest.json',
                files: {
                    './static/template.html': './_build/static/index.html',
                },
            }),
            prod && terser(),
        ],
    },
    {
        input: './static/sw/index.ts',
        output: {
            dir: './_build/static',
            entryFileNames: 'sw.js',
            format: 'esm',
            sourcemap: true,
        },
        plugins: [
            resolve(),
            typescript(),
            dotenv({
                path: path.resolve(__dirname, './dotenv'),
                example: path.resolve(__dirname, './dotenv.example'),
            }),
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
