import Knex from 'knex'
import { config } from './config'
import { lazy } from '../../util/lazy'

const conn = lazy(() => Knex(config))

export const model = {
    async init() {},
    async destroy() {
        await conn().destroy()
    },

    async getUserById(id: number): Promise<User | null> {
        const r = await conn()
            .select('id', 'github_id as githubId', 'email')
            .from('feedbox_user')
            .where({ id })
        if (r.length > 0) {
            return r[0]
        } else {
            return null
        }
    },

    async getUserIdByGithub(
        github_id: number,
        email: string,
    ): Promise<number | null> {
        const tnx = await conn().transaction()
        try {
            await tnx.raw(
                `INSERT INTO feedbox_user(github_id,email) VALUES(?,?)
                ON CONFLICT(github_id) DO UPDATE SET email=?`,
                [github_id, email, email],
            )
            const r = await tnx
                .select('id')
                .from('feedbox_user')
                .where({ email })
            await tnx.commit()
            return r[0].id
        } catch (err) {
            await tnx.rollback(err)
            return null
        }
    },

    async getFeedIdByUrl(url: string): Promise<number | null> {
        const tnx = await conn().transaction()
        try {
            await tnx.raw(
                `INSERT INTO feedbox_feed(url) VALUES(?)
                ON CONFLICT DO NOTHING`,
                [url],
            )
            const r = await tnx
                .select('id')
                .from('feedbox_feed')
                .where({ url })
            await tnx.commit()
            return r[0].id
        } catch (err) {
            await tnx.rollback(err)
            return null
        }
    },

    async getFeedByUser(userId: number): Promise<Feed[]> {
        const r = await conn()
            .select(
                'feedbox_feed.id as id',
                'feedbox_feed.url as url',
                'feedbox_feed.updated as updated',
            )
            .from('feedbox_r_user_feed')
            .innerJoin(
                'feedbox_user',
                'feedbox_user.id',
                'feedbox_r_user_feed.user_id',
            )
            .innerJoin(
                'feedbox_feed',
                'feedbox_feed.id',
                'feedbox_r_user_feed.feed_id',
            )
            .where('feedbox_user.id', userId)
            .orderBy('feedbox_feed.updated', 'desc')
        return r
    },

    async prepareFeedForUpdate(): Promise<FeedDoc[]> {
        const feeds = await conn()
            .select(
                'feedbox_feed.id as id',
                'feedbox_feed.url as url',
                'feedbox_feed.updated as updated',
                'feedbox_user.email as email',
            )
            .from('feedbox_r_user_feed')
            .innerJoin(
                'feedbox_feed',
                'feedbox_feed.id',
                'feedbox_r_user_feed.feed_id',
            )
            .innerJoin(
                'feedbox_user',
                'feedbox_user.id',
                'feedbox_r_user_feed.user_id',
            )
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
            .from('feedbox_link')
            .whereIn('feed_id', Array.from(map.keys()))
        links.forEach(({ feed_id, url }) => {
            const v = map.get(feed_id)!
            v.links.add(url)
        })
        return Array.from(map.values())
    },

    async addLink(feed_id: number, url: string) {
        await conn()
            .insert({ feed_id, url })
            .into('feedbox_link')
    },

    async updateFeedUpdated(id: number, updated: Date) {
        await conn()('feedbox_feed')
            .where({ id })
            .update({ updated })
    },

    async subscribe(user_id: number, feed_id: number) {
        await conn().raw(
            `INSERT INTO feedbox_r_user_feed(user_id, feed_id) VALUES(?,?)
            ON CONFLICT DO NOTHING`,
            [user_id, feed_id],
        )
    },

    async unsubscribe(user_id: number, feed_id: number) {
        await conn()
            .from('feedbox_r_user_feed')
            .where({ user_id, feed_id })
            .del()
    },

    async subscribeUrls(user_id: number, urls: string[]) {
        if (urls.length === 0) return
        const qvalue = urls.map(_ => '(?)').join(',')
        const qrange = urls.map(_ => '?').join(',')
        const tnx = await conn().transaction()
        try {
            await tnx.raw(
                `INSERT INTO feedbox_feed(url) VALUES ${qvalue}
                ON CONFLICT DO NOTHING`,
                urls,
            )
            await tnx.raw(
                `INSERT INTO feedbox_r_user_feed(user_id, feed_id)
                SELECT ?, feedbox_feed.id FROM feedbox_feed WHERE feedbox_feed.url in (${qrange})
                ON CONFLICT DO NOTHING`,
                [user_id, ...urls],
            )
            await tnx.commit()
        } catch (err) {
            await tnx.rollback(err)
        }
    },
}

export interface User {
    id: number
    github_id: number
    email: string
}

export interface Feed {
    id: number
    url: string
    updated: number | null
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
    updated: number | null
    emails: string[]
    links: Set<string>
}
