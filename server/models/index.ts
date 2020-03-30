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
            const r = await tnx.select('id').from('feedbox_feed').where({ url })
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

    async getActiveFeeds(): Promise<Feed[]> {
        const feeds = await conn()
            .select(
                'feedbox_feed.id as id',
                'feedbox_feed.url as url',
                'feedbox_feed.links as links',
                'feedbox_feed.updated as updated',
            )
            .from('feedbox_feed')
            .innerJoin(
                'feedbox_r_user_feed',
                'feedbox_r_user_feed.feed_id',
                'feedbox_feed.id',
            )
        return feeds
    },

    async getSubscribers(id: number): Promise<User[]> {
        const users = await conn()
            .select(
                'feedbox_user.id as id',
                'feedbox_user.github_id as githubId',
                'feedbox_user.email as email',
            )
            .from('feedbox_user')
            .innerJoin(
                'feedbox_r_user_feed',
                'feedbox_r_user_feed.user_id',
                'feedbox_user.id',
            )
            .where({ 'feedbox_r_user_feed.feed_id': id })
        return users
    },

    async updateFeed(id: number, links: string[], updated: Date) {
        await conn()('feedbox_feed')
            .where({ id })
            .update({ links: JSON.stringify(links), updated })
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
        const qvalue = urls.map((_) => '(?)').join(',')
        const qrange = urls.map((_) => '?').join(',')
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
    links: string[]
}

export interface RUserFeed {
    user_id: number
    feed_id: number
}
