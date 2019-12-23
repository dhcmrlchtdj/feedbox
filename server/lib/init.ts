import 'reflect-metadata'
import * as path from 'path'
import * as dotenv from 'dotenv-safe'
import initDB from './models'

export default async () => {
    if (process.env.NODE_ENV !== 'production') {
        dotenv.config({
            path: path.resolve(__dirname, '../dotenv'),
            example: path.resolve(__dirname, '../dotenv.example'),
        })
    }

    await initDB()
}

process.on('unhandledRejection', err => {
    console.error(err)
    process.exit(1)
})
