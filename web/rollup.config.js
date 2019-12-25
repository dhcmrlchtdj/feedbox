import * as path from 'path'
import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import svelte from 'rollup-plugin-svelte'
import { terser } from 'rollup-plugin-terser'
import serve from 'rollup-plugin-serve'
import { manifest, template, dotenv } from '@feedbox/rollup-plugin'

const prod = process.env.NODE_ENV === 'production'

export default [
    {
        input: './src/app.js',
        output: {
            dir: './_build',
            entryFileNames: '[name].[hash].js',
            chunkFileNames: '[name].[hash].js',
            format: 'esm',
            sourcemap: true,
        },
        plugins: [
            resolve(),
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
            manifest('./_build/manifest.json'),
            template({
                manifest: './_build/manifest.json',
                files: { './src/template.html': './_build/index.html' },
            }),
            prod && terser(),
            process.env.DEV_SERVER &&
                serve({ port: 9000, contentBase: './_build' }),
        ].filter(Boolean),
    },
    {
        input: './src/sw.js',
        output: {
            dir: './_build',
            entryFileNames: '[name].js',
            chunkFileNames: '[name].[hash].js',
            format: 'esm',
            sourcemap: true,
        },
        plugins: [
            resolve(),
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
        ].filter(Boolean),
    },
]
