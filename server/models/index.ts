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
        const user = await db.tx(async (t) => {
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
        return user
    },

    async getOrCreateUserByTelegram(chatId: string): Promise<User> {
        const user = await db.tx(async (t) => {
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
            JOIN feeds ON r.fid = feeds.id
            JOIN users ON r.uid = users.id
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
            JOIN r_user_feed r ON r.fid = feeds.id`,
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
                users.platform AS platform,
                users.pid AS pid,
                users.addition AS addition
            FROM users
            JOIN r_user_feed r ON r.uid = users.id
            WHERE r.fid = $1`,
            feedId,
        )
        return users
    },

    async subscribe(userId: number, feedId: number) {
        await db.none(
            `INSERT INTO r_user_feed(uid, fid)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING`,
            [userId, feedId],
        )
    },

    async unsubscribe(userId: number, feedId: number) {
        await db.none(
            `DELETE FROM r_user_feed
            WHERE uid = $1
            AND fid = $2`,
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
                `INSERT INTO r_user_feed(uid, fid)
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
            WHERE uid = $1
            AND fid IN
                (SELECT id FROM feeds WHERE url in (${uvalues}))`,
            [userId, ...urls],
        )
    },

    async unsubscribeAll(userId: number) {
        await db.none(
            `DELETE FROM r_user_feed
            WHERE uid = $1`,
            [userId],
        )
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
