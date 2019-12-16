import * as path from 'path'
import * as dotenv from 'dotenv-safe'
import replace from 'rollup-plugin-replace'
import ts from 'rollup-plugin-typescript'
import typescript from 'typescript'

dotenv.config({
    path: path.resolve(__dirname, './dotenv'),
    example: path.resolve(__dirname, './dotenv.example'),
})
const envs = Object.entries(process.env).reduce((acc, curr) => {
    acc[`process.env.` + curr[0]] = JSON.stringify(curr[1])
    return acc
}, {})

export default [
    {
        input: './src/index.ts',
        output: {
            dir: './_build',
            entryFileNames: '[name].js',
            format: 'esm',
        },
        plugins: [replace(envs), ts({ typescript })],
    },
]
