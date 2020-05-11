import * as path from 'path'
import * as dotenv from 'dotenv-safe'

dotenv.config({
    // relative to _build/backend/server/init-env.js
    path: path.resolve(__dirname, '../../../../dotenv'),
    example: path.resolve(__dirname, '../../../../dotenv.example'),
})

require('newrelic')
