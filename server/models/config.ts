import * as path from 'path'

export const config = {
    debug: process.env.DEBUG_SQL === 'true',
    migrations: {
        directory: path.resolve(__dirname, '../../migrations'),
        tableName: 'knex_migrations',
    },
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 2, max: 10 },
}

export const production = config
export const development = config
