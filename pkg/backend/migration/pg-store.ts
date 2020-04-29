import { db } from '../server/models/connection'

class PGStore {
    constructor() {}
    async load(fn) {
        try {
            const row = await db.oneOrNone('SELECT data FROM migrations')
            if (row === null) {
                return fn(null, {})
            } else {
                return fn(null, row.data)
            }
        } catch (_err) {
            fn(null, {})
        }
    }
    async save(set, fn) {
        try {
            await db.task(async (t) => {
                await t.none(
                    'CREATE TABLE IF NOT EXISTS migrations (id integer PRIMARY KEY, data jsonb NOT NULL)',
                )
                await t.none(
                    `INSERT INTO migrations (id, data) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET data = $1`,
                    [
                        {
                            lastRun: set.lastRun,
                            migrations: set.migrations,
                        },
                    ],
                )
            })
            fn()
        } catch (err) {
            fn(err)
        } finally {
            db.$pool.end()
        }
    }
}

module.exports = PGStore
