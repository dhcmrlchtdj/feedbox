import { db } from '../server/models/connection'

export const up = (next) => {
    db.tx(async (t) => {
        await t.none(
            `CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                platform VARCHAR(64) NOT NULL,
                pid VARCHAR(256) NOT NULL,
                addition JSONB NOT NULL DEFAULT '{}'::jsonb,
                UNIQUE (platform, pid)
            )`,
        )

        await t.none(
            `CREATE TABLE feeds (
                id SERIAL PRIMARY KEY,
                url VARCHAR(2048) NOT NULL UNIQUE,
                updated TIMESTAMPTZ,
                links JSONB NOT NULL DEFAULT '[]'::jsonb
            )`,
        )

        await t.none(
            `CREATE TABLE r_user_feed (
                id SERIAL PRIMARY KEY,
                uid INT NOT NULL REFERENCES users(id),
                fid INT NOT NULL REFERENCES feeds(id),
                UNIQUE(uid, fid)
            )`,
        )
    }).then(() => next())
}

export const down = (next) => {
    db.tx(async (t) => {
        await t.none(`DROP TABLE IF EXISTS r_user_feed`)
        await t.none(`DROP TABLE IF EXISTS feeds`)
        await t.none(`DROP TABLE IF EXISTS users`)
    }).then(() => next())
}
