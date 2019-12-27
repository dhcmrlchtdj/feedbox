import * as path from 'path'
import * as Knex from 'knex'
import lazy from '../utils/lazy'

const prod = process.env.NODE_ENV === 'production'

const common = {
    debug: !prod,
    asyncStackTraces: !prod,
    migrations: {
        directory: path.resolve(__dirname, '../migrations'),
        tableName: 'knex_migrations',
    },
}

const sqlite3 = {
    client: 'sqlite3',
    connection: {
        filename: path.resolve(__dirname, './feedbox.sqlite'),
    },
    useNullAsDefault: true,
}

const pg = {
    client: 'pg',
    connection: `${process.env.DATABASE_URL}?ssl=true`,
}

export const cfg = Object.assign({}, common, prod ? pg : sqlite3)

const conn = lazy(() => Knex(cfg))

export default conn
