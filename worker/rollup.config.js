import * as path from 'path'
import * as dotenv from 'dotenv-safe'
import replace from 'rollup-plugin-replace'

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
        input: './_build/lib/index.js',
        output: {
            dir: './_build/bundle/',
            entryFileNames: '[name].js',
            format: 'esm',
        },
        plugins: [replace(envs)],
    },
]
