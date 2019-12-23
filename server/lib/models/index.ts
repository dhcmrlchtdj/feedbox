import * as path from 'path'
import { createConnection } from 'typeorm'
import User from './user'
import Feed from './feed'
import Link from './link'

const initDB = async () => {
    const base = {
        entities: [User, Feed, Link],
        // maxQueryExecutionTime: 100,
        // logging: true,
        logger: 'simple-console',
        synchronize: true,
    }
    const sqlite = Object.assign(
        {
            type: 'sqlite',
            database: path.resolve(
                __dirname,
                '../../src/databases/feedbox.sqlite',
            ),
        },
        base,
    )
    const postgres = Object.assign(
        {
            type: 'postgres',
            url: process.env.DATABASE_URL,
        },
        base,
    )
    const config = process.env.NODE_ENV === 'production' ? postgres : sqlite
    await createConnection(config as any)
}

export default initDB
