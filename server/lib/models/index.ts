import conn from './conn'

export interface User {
    id: number
    github_id: number
    email: string
}

export interface Feed {
    id: number
    url: string
    updated: Date
}

export interface Link {
    id: number
    url: string
    feed_id: number
}

export interface RUserFeed {
    user_id: number
    feed_id: number
}

export interface FeedDoc {
    id: number
    url: string
    updated: Date
    emails: string[]
    links: Set<string>
}

const prod = process.env.NODE_ENV === 'production'

export default {
    async init() {
        const k = await conn()
        await k.schema
            .dropTableIfExists('RUserFeed')
            .dropTableIfExists('Link')
            .dropTableIfExists('Feed')
            .dropTableIfExists('User')
            .createTable('User', table => {
                table.increments('id')
                table.dateTime('created_at').defaultTo(k.fn.now())
                table
                    .integer('github_id')
                    .notNullable()
                    .unique()
                table
                    .string('email', 255)
                    .notNullable()
                    .unique()
            })
            .createTable('Feed', table => {
                table.increments('id')
                table.dateTime('created_at').defaultTo(k.fn.now())
                table
                    .string('url', 255)
                    .notNullable()
                    .unique()
                table
                    .dateTime('updated')
                    .nullable()
                    .defaultTo(null)
            })
            .createTable('Link', table => {
                table.increments('id')
                table.dateTime('created_at').defaultTo(k.fn.now())
                table.integer('url', 255).notNullable()
                table.integer('feed_id').unsigned()
                table.foreign('feed_id').references('Feed.id')
            })
            .createTable('RUserFeed', table => {
                table.increments('id')
                table.dateTime('created_at').defaultTo(k.fn.now())
                table.integer('user_id').unsigned()
                table.integer('feed_id').unsigned()
                table.unique(['user_id', 'feed_id'])
                table.foreign('user_id').references('User.id')
                table.foreign('feed_id').references('Feed.id')
            })
    },

    async getUserById(id: number): Promise<User | null> {
        const r = await conn()
            .select('id', 'github_id as githubId', 'email')
            .from('User')
            .where({ id })
        if (r.length > 0) {
            return r[0]
        } else {
            return null
        }
    },

    async getUserIdByGithub(github_id: number, email: string): Promise<number> {
        if (prod) {
            const r = await conn().raw(
                `INSERT INTO User(github_id,email) VALUES(?,?)
                ON CONFLICT(github_id) DO UPDATE SET email=?
                RETURNING id`,
                [github_id, email, email],
            )
            return r[0].id
        } else {
            await conn().raw(
                `INSERT INTO User(github_id,email) VALUES(?,?)
                ON CONFLICT(github_id) DO UPDATE SET email=?`,
                [github_id, email, email],
            )
            const r = await conn()
                .select('id')
                .from('User')
                .where({ email })
            return r[0].id
        }
    },

    async getFeedIdByUrl(url: string): Promise<number> {
        if (prod) {
            const r = await conn().raw(
                `INSERT INTO Feed(url) VALUES(?)
                ON CONFLICT DO NOTHING
                RETURNING id`,
                [url],
            )
            return r[0].id
        } else {
            await conn().raw(
                `INSERT INTO Feed(url) VALUES(?)
                ON CONFLICT DO NOTHING`,
                [url],
            )
            const r = await conn()
                .select('id')
                .from('Feed')
                .where({ url })
            return r[0].id
        }
    },

    async getFeedByUser(userId: number): Promise<Feed[]> {
        const r = await conn()
            .select(
                'Feed.id as id',
                'Feed.url as url',
                'Feed.updated as updated',
            )
            .from('RUserFeed')
            .innerJoin('User', 'User.id', 'RUserFeed.user_id')
            .innerJoin('Feed', 'Feed.id', 'RUserFeed.feed_id')
            .where('User.id', userId)
        return r
    },

    async prepareFeedForUpdate(): Promise<FeedDoc[]> {
        const feeds = await conn()
            .select(
                'Feed.id as id',
                'Feed.url as url',
                'Feed.updated as updated',
                'User.email as email',
            )
            .from('RUserFeed')
            .innerJoin('Feed', 'Feed.id', 'RUserFeed.feed_id')
            .innerJoin('User', 'User.id', 'RUserFeed.user_id')
        const map = new Map<number, FeedDoc>()
        feeds.forEach(({ id, url, updated, email }) => {
            const v = map.get(id) ?? {
                id,
                url,
                updated,
                emails: [] as string[],
                links: new Set(),
            }
            v.emails.push(email)
            map.set(id, v)
        })
        const links = await conn()
            .select('feed_id', 'url')
            .from('Link')
            .whereIn('feed_id', Array.from(map.keys()))
        links.forEach(({ feed_id, url }) => {
            const v = map.get(feed_id)!
            v.links.add(url)
        })
        return Array.from(map.values())
    },

    async addLinks(links: { feed_id: number; url: string }[]) {
        await conn()
            .insert(links)
            .into('Link')
    },

    async updateFeedUpdated(feeds: { id: number; updated: Date | null }[]) {
        const tnx = await conn().transaction()
        const tasks = feeds.map(async ({ id, updated }) => {
            await tnx('Feed')
                .where({ id })
                .update({ updated })
        })
        await Promise.all(tasks)
            .then(tnx.commit)
            .catch(tnx.rollback)
    },

    async subscribe(user_id: number, feed_id: number) {
        await conn().raw(
            `INSERT INTO RUserFeed(user_id, feed_id) VALUES(?,?)
            ON CONFLICT DO NOTHING`,
            [user_id, feed_id],
        )
    },

    async unsubscribe(user_id: number, feed_id: number) {
        await conn()
            .from('RUserFeed')
            .where({ user_id, feed_id })
            .del()
    },

    async subscribeUrls(user_id: number, urls: string[]) {
        const qvalue = urls.map(_ => '(?)').join(',')
        await conn().raw(
            `INSERT INTO Feed(url) VALUES ${qvalue}
            ON CONFLICT DO NOTHING`,
            urls,
        )
        const qrange = urls.map(_ => '?').join(',')
        await conn().raw(
            `INSERT INTO RUserFeed(user_id, feed_id)
            SELECT ?, Feed.id FROM Feed WHERE Feed.url in (${qrange})
            ON CONFLICT DO NOTHING`,
            [user_id, ...urls],
        )
    },
}
