import * as path from 'path'
import * as dotenv from 'dotenv-safe'
import { model } from './models'

export const prepare = async () => {
    dotenv.config({
        // '*.ts' will be compiled to '_build/*.js'
        path: path.resolve(__dirname, '../../dotenv'),
        example: path.resolve(__dirname, '../../dotenv.example'),
    })
    await model.init()
}

process.on('unhandledRejection', (err) => {
    console.error(err)
    process.exit(1)
})
