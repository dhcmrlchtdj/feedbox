import * as path from 'path'
import * as dotenv from 'dotenv-safe'

export default async () => {
    dotenv.config({
        path: path.resolve(__dirname, '../../dotenv'),
        example: path.resolve(__dirname, '../../dotenv.example'),
    })
}

process.on('unhandledRejection', err => {
    console.error(err)
    process.exit(1)
})
