import * as path from 'path'
import * as dotenv from 'dotenv-safe'
import Model from './models'

export default async () => {
    dotenv.config({
        path: path.resolve(__dirname, '../../dotenv'),
        example: path.resolve(__dirname, '../../dotenv.example'),
    })
    await Model.init()
}

process.on('unhandledRejection', err => {
    console.error(err)
    process.exit(1)
})
