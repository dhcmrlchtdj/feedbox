import * as path from 'path'

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
    pool: { min: 2, max: 20 },
}

export const production = Object.assign({}, common, pg)
export const development = Object.assign({}, common, sqlite3)
export const config = prod ? production : development
