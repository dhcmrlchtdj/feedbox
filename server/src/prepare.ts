import 'reflect-metadata'
import * as path from 'path'
import * as dotenv from 'dotenv-safe'
import initDB from './models'

process.on('unhandledRejection', err => {
    console.error(err)
    process.exit(1)
})

if (process.env.NODE_ENV !== 'production') {
    dotenv.config({
        path: path.resolve(__dirname, '../dotenv'),
        example: path.resolve(__dirname, '../dotenv.example'),
    })
}

export default async () => {
    await initDB()
}
