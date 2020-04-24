import { db } from './connection'

export const model = {
    async destroy() {
        db.$pool.end()
    },

    async getUserById(id: number): Promise<User | null> {
        const user = await db.oneOrNone<User>(
            `SELECT id, type, info
            FROM users
            WHERE id = $1`,
            id,
        )
        return user
    },

    async getOrCreateUserByGithub(
        githubId: number,
        email: string,
    ): Promise<User> {
        const user = await db.one<GithubUser>(
            `INSERT INTO users(type, info)
             VALUES ('github', $1)
             ON CONFLICT((info->>'githubId')) DO UPDATE SET info = $1
             RETURNING id, type, info`,
            [{ githubId, email }],
        )
        return user
    },

    async getOrCreateUserByTelegram(chatId: number): Promise<User> {
        const user = await db.tx(async (t) => {
            let user = await t.oneOrNone<TelegramUser>(
                `SELECT id, type, info
                FROM users
                WHERE type = 'telegram'
                AND info->>'chatId' = $1`,
                [String(chatId)],
            )
            if (user === null) {
                user = await t.one<TelegramUser>(
                    `INSERT INTO users(type, info)
                    VALUES ('telegram', $1)
                    RETURNING id, type, info`,
                    [{ chatId }],
                )
            }
            return user
        })
        return user
    },

    async getFeedIdByUrl(url: string): Promise<number> {
        const id = await db.tx(async (t) => {
            let feed = await t.oneOrNone<{ id: number }>(
                `SELECT id
                FROM feeds
                WHERE url = $1`,
                [url],
            )
            if (feed === null) {
                feed = await t.one<{ id: number }>(
                    `INSERT INTO feeds(url) VALUES ($1) RETURNING id`,
                    [url],
                )
            }
            return feed.id
        })
        return id
    },

    async getFeedByUser(userId: number): Promise<Feed[]> {
        const feeds = await db.manyOrNone<Feed>(
            `SELECT
                feeds.id AS id,
                feeds.url AS url,
                feeds.updated AS updated
            FROM r_user_feed AS r
            JOIN feeds ON r.feed_id = feeds.id
            JOIN users ON r.user_id = users.id
            WHERE users.id = $1
            ORDER BY feeds.updated DESC`,
            [userId],
        )
        return feeds
    },

    async updateFeed(id: number, links: string[], updated: Date) {
        await db.none(
            `UPDATE feeds
            SET links = $1, updated = $2
            WHERE id = $3`,
            [JSON.stringify(links), updated, id],
        )
    },

    async getActiveFeeds(): Promise<Feed[]> {
        const feeds = await db.manyOrNone<Feed>(
            `SELECT
                feeds.id AS id,
                feeds.url AS url,
                feeds.updated AS updated
            FROM feeds
            JOIN r_user_feed r ON r.feed_id = feeds.id`,
        )
        return feeds
    },

    async getLinks(feedId: number): Promise<string[]> {
        const feed = await db.one<{ links: string[] }>(
            `SELECT links
            FROM feeds
            WHERE id = $1`,
            [feedId],
        )
        return feed.links
    },

    async getSubscribers(feedId: number): Promise<User[]> {
        const users = await db.manyOrNone<User>(
            `SELECT
                users.id AS id,
                users.type AS type,
                users.info AS info
            FROM users
            JOIN r_user_feed r ON r.user_id = users.id
            WHERE r.feed_id = $1`,
            feedId,
        )
        return users
    },

    async subscribe(userId: number, feedId: number) {
        await db.none(
            `INSERT INTO r_user_feed(user_id, feed_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING`,
            [userId, feedId],
        )
    },

    async unsubscribe(userId: number, feedId: number) {
        await db.none(
            `DELETE FROM r_user_feed
            WHERE user_id = $1
            AND feed_id = $2`,
            [userId, feedId],
        )
    },

    async subscribeUrls(userId: number, urls: string[]) {
        if (urls.length === 0) return
        await db.tx(async (t) => {
            const fvalues = urls.map((_, idx) => `(\$${idx + 1})`).join(', ')
            await t.none(
                `INSERT INTO feeds(url) VALUES ${fvalues}
                ON CONFLICT DO NOTHING`,
                urls,
            )

            const rvalues = urls.map((_, idx) => `\$${idx + 2}`).join(', ')
            await t.none(
                `INSERT INTO r_user_feed(user_id, feed_id)
                SELECT $1, id FROM feeds WHERE url IN (${rvalues})
                ON CONFLICT DO NOTHING`,
                [userId, ...urls],
            )
        })
    },

    async unsubscribeUrls(userId: number, urls: string[]) {
        if (urls.length === 0) return
        const uvalues = urls.map((_, idx) => `\$${idx + 2}`).join(', ')
        await db.none(
            `DELETE FROM r_user_feed
            WHERE user_id = $1
            AND feed_id IN
                (SELECT id FROM feeds WHERE url in (${uvalues}))`,
            [userId, ...urls],
        )
    },
}

export type GithubUser = {
    id: number
    type: 'github'
    info: {
        githubId: number
        email: string
    }
}
export type TelegramUser = {
    id: number
    type: 'telegram'
    info: {
        chatId: number
    }
}
export type User = GithubUser | TelegramUser

export type Feed = {
    id: number
    url: string
    updated: number | null
}
