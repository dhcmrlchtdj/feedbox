import * as path from 'path'
import * as dotenv from 'dotenv-safe'

dotenv.config({
    path: path.resolve(__dirname, '../../../../dotenv'),
    example: path.resolve(__dirname, '../../../../dotenv.example'),
})
