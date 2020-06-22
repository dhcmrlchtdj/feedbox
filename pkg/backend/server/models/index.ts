import { db } from './connection'

export const model = {
    async destroy() {
        db.$pool.end()
    },

    async getUserById(id: number): Promise<User | null> {
        const user = await db.oneOrNone<User>(
            `SELECT id, platform, pid, addition
            FROM users
            WHERE id = $1`,
            id,
        )
        return user
    },

    async getOrCreateUserByGithub(
        githubId: string,
        email: string,
    ): Promise<User> {
        return db.tx(async (t) => {
            let user = await t.oneOrNone<GithubUser>(
                `SELECT id, platform, pid, addition
                FROM users
                WHERE platform = 'github'
                AND pid = $1`,
                [githubId],
            )
            if (user === null) {
                user = await t.one<GithubUser>(
                    `INSERT INTO users(platform, pid, addition)
                    VALUES ('github', $1, $2)
                    RETURNING id, platform, pid, addition`,
                    [githubId, { email }],
                )
            } else {
                if (user.addition.email !== email) {
                    await t.none(
                        `UPDATE users SET addition = $1 WHERE id = $2`,
                        [{ email }, user.id],
                    )
                }
            }
            return user
        })
    },

    async getOrCreateUserByTelegram(chatId: string): Promise<User> {
        return db.tx(async (t) => {
            let user = await t.oneOrNone<TelegramUser>(
                `SELECT id, platform, pid, addition
                FROM users
                WHERE platform = 'telegram'
                AND pid = $1`,
                [chatId],
            )
            if (user === null) {
                user = await t.one<TelegramUser>(
                    `INSERT INTO users(platform, pid)
                    VALUES ('telegram', $1)
                    RETURNING id, platform, pid, addition`,
                    [chatId],
                )
            }
            return user
        })
    },

    async getFeedIdByUrl(url: string): Promise<number> {
        return db.tx(async (t) => {
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
    },

    async getFeedByUser(userId: number): Promise<Feed[]> {
        return db.manyOrNone<Feed>(
            `SELECT id, url, updated
            FROM feeds
            WHERE id IN (SELECT fid FROM r_user_feed WHERE uid = $1)
            ORDER BY updated DESC`,
            [userId],
        )
    },

    async updateFeed(
        id: number,
        links: string[],
        updated: Date,
    ): Promise<void> {
        await db.none(
            `UPDATE feeds
            SET links = $1, updated = $2
            WHERE id = $3`,
            [JSON.stringify(links), updated, id],
        )
    },

    async getActiveFeeds(): Promise<Feed[]> {
        return db.manyOrNone<Feed>(
            `SELECT id, url, updated
            FROM feeds
            WHERE id IN (SELECT fid FROM r_user_feed)`,
        )
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
        return db.manyOrNone<User>(
            `SELECT id, platform, pid, addition
            FROM users
            WHERE id IN (SELECT uid FROM r_user_feed WHERE fid = $1)`,
            feedId,
        )
    },

    async subscribe(userId: number, feedId: number): Promise<number> {
        const r = await db.result(
            `INSERT INTO r_user_feed(uid, fid)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING`,
            [userId, feedId],
        )
        return r.rowCount
    },

    async unsubscribe(userId: number, feedId: number): Promise<number> {
        const r = await db.result(
            `DELETE FROM r_user_feed
            WHERE uid = $1
            AND fid = $2`,
            [userId, feedId],
        )
        return r.rowCount
    },

    async subscribeUrls(userId: number, urls: string[]): Promise<number> {
        if (urls.length === 0) return 0
        return db.tx(async (t) => {
            const fvalues = urls.map((_, idx) => `(\$${idx + 1})`).join(', ')
            await t.none(
                `INSERT INTO feeds(url) VALUES ${fvalues}
                ON CONFLICT DO NOTHING`,
                urls,
            )

            const rvalues = urls.map((_, idx) => `\$${idx + 2}`).join(', ')
            const r = await t.result(
                `INSERT INTO r_user_feed(uid, fid)
                SELECT $1, id FROM feeds WHERE url IN (${rvalues})
                ON CONFLICT DO NOTHING`,
                [userId, ...urls],
            )
            return r.rowCount
        })
    },

    async unsubscribeUrls(userId: number, urls: string[]): Promise<number> {
        if (urls.length === 0) return 0
        const uvalues = urls.map((_, idx) => `\$${idx + 2}`).join(', ')
        const r = await db.result(
            `DELETE FROM r_user_feed
            WHERE uid = $1
            AND fid IN (SELECT id FROM feeds WHERE url in (${uvalues}))`,
            [userId, ...urls],
        )
        return r.rowCount
    },

    async unsubscribeAll(userId: number): Promise<number> {
        const r = await db.result(
            `DELETE FROM r_user_feed
            WHERE uid = $1`,
            [userId],
        )
        return r.rowCount
    },
}

export type GithubUser = {
    id: number
    platform: 'github'
    pid: string
    addition: {
        email: string
    }
}
export type TelegramUser = {
    id: number
    platform: 'telegram'
    pid: string
    addition: {}
}
export type User = GithubUser | TelegramUser

export type Feed = {
    id: number
    url: string
    updated: number | null
}
