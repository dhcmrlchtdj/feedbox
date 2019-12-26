import * as path from 'path'
import * as knex from 'knex'

const prod = process.env.NODE_ENV === 'production'

const common = {
    debug: !prod,
    asyncStackTraces: !prod,
}

const sqlite3 = {
    client: 'sqlite3',
    connection: {
        filename: path.resolve(__dirname, './feedbox.sqlite'),
    },
}

const pg = {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 0, max: 10 },
}

export default () => {
    const cfg = Object.assign({}, common, prod ? pg : sqlite3)
    const conn = knex(cfg)
    return conn
}
