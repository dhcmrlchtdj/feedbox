import { db } from '../server/models/connection'

export const up = (next) => {
    db.tx(async (t) => {
        await t.none(
            `CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                type VARCHAR(64) NOT NULL,
                info JSONB NOT NULL
            )`,
        )
        await t.none(
            `CREATE UNIQUE INDEX users_github_idx ON users( (info->>'githubId') )`,
        )
        await t.none(
            `CREATE UNIQUE INDEX users_telegram_idx ON users( (info->>'chatId') )`,
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
                user_id INT NOT NULL REFERENCES users(id),
                feed_id INT NOT NULL REFERENCES feeds(id),
                UNIQUE(user_id, feed_id)
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
