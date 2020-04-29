import '../init-env'
import pgPromise from 'pg-promise'
import pgMonitor from 'pg-monitor'

const pgInit = {}
if (process.env.ENABLE_PG_MONITOR) {
    pgMonitor.attach(pgInit)
}

export const pgp = pgPromise(pgInit)
export const db = pgp({
    connectionString: process.env.DATABASE_URL!,
    max: 10,
    // ssl: { rejectUnauthorized: false }, // connect to heroku database on local
})
