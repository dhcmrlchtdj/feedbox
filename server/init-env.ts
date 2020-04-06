import * as path from 'path'
import * as dotenv from 'dotenv-safe'

dotenv.config({
    // '*.ts' will be compiled to '_build/*.js'
    path: path.resolve(__dirname, '../../dotenv'),
    example: path.resolve(__dirname, '../../dotenv.example'),
})
