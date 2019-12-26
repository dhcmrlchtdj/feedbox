import conn from './conn'

export interface User {
    id: number
    github_id: number
    email: string
}

export interface Feed {
    id: number
    url: string
}

export interface Link {
    id: number
    url: string
    feed_id: number
}

interface RUserFeed {
    user_id: number
    feed_id: number
}

const db = {
    async getUserById(id: number): Promise<User | null> {
        const r = await conn()
            .select('id', 'github_id as githubId', 'email')
            .from<User>('User')
            .where({ id })
            .limit(1)
        if (r.length > 0) {
            return r[0]
        } else {
            return null
        }
    },

    async getUserIdByGithub(github_id: number, email: string): Promise<number> {
        await conn().raw(
            'INSERT INTO User(github_id,email) VALUES(?,?) ON CONFLICT DO UPDATE SET github_id=?,email=?',
            [github_id, email, github_id, email],
        )
        const r = await conn()
            .select()
            .from<User>('User')
            .select('id')
            .where({ email })
        return r[0]
    },

    async getFeedIdByUrl(url: string): Promise<number> {
        await conn().raw(
            'INSERT INTO Feed(url) VALUES(?) ON CONFLICT DO NOTHING',
            [url],
        )
        const r = await conn()
            .select()
            .from<Feed>('Feed')
            .select('id')
            .where({ url })
        return r[0]
    },

    async getFeedByUser(userId: number): Promise<Feed[]> {
        const r = await conn()
            .select('Feed.id as id', 'Feed.url as url')
            .from('RUserFeed')
            .innerJoin('User', 'User.id', 'RUserFeed.user_id')
            .innerJoin('Feed', 'Feed.id', 'RUserFeed.feed_id')
            .where('User.id', userId)
        return r
    },

    async getFeedForUpdate(): Promise<Map<Feed, User[]>> {
        // TODO
        const r = await conn()
            .select('feed_id', 'user_id')
            .from<RUserFeed>('r_user_feed')
        const feeds = [] as Feed[]
        const feedMap = feeds.reduce((map, feed) => {
            map[feed.id] = feed
            return map
        }, new Map<number, Feed>())
        const users = [] as User[]
        const userMap = users.reduce((map, user) => {
            map[user.id] = user
            return map
        }, new Map<number, User>())
        const o = r.reduce((map, { feedId, userId }) => {
            const feed = feedMap.get(feedId)!!
            const user = userMap.get(userId)!!
            const arr = map.get(feed) ?? []
            arr.push(user)
            map.set(feed, arr)
            return map
        }, new Map<Feed, User[]>())
        return o
    },

    async subscribe(user_id: number, feed_id: number) {
        await conn()
            .insert({ user_id, feed_id })
            .into<RUserFeed>('RUserFeed')
    },

    async unsubscribe(user_id: number, feed_id: number) {
        await conn()
            .from('RUserFeed')
            .where({ user_id, feed_id })
            .del()
    },

    async subscribeUrls(user_id: number, urls: string[]) {
        await conn()
            .insert(urls.map(url => ({ url })))
            .into<Feed>('Feed')
        await conn().raw(
            `insert into RUserFeed(user_id, feed_id)
            (select "?", Feed.id from Feed where Feed.url in ?)
            on conflict do nothing`,
            [user_id, urls],
        )
    },
}

export default db
