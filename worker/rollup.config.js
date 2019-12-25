import * as path from 'path'
import { dotenv } from '@feedbox/rollup-plugin'

export default [
    {
        input: './_build/lib/index.js',
        output: {
            dir: './_build/bundle/',
            entryFileNames: '[name].js',
            format: 'esm',
        },
        plugins: [
            dotenv({
                path: path.resolve(__dirname, './dotenv'),
                example: path.resolve(__dirname, './dotenv.example'),
            }),
        ],
    },
]
