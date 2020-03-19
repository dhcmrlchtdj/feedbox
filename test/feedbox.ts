import FormData from 'form-data'
import { init } from '../server/server'
import { model } from '../server/models'

let server: any
const auth = {
    strategy: 'session',
    credentials: { userId: 0 },
}
beforeAll(async () => {
    server = await init()
    const id = await model.getUserIdByGithub(1, 'user@example.com')
    if (id === null) {
        throw Error('user id')
    } else {
        auth.credentials.userId = id
    }
})
afterAll(async () => {
    if (server) {
        await server.stop()
    }
})

describe('user API', () => {
    test('/api/v1/user', async () => {
        const resp = await server.inject({
            method: 'get',
            url: '/api/v1/user',
            auth,
        })
        expect(resp.result).toMatchSnapshot()
    })

    test('/api/logout', async () => {
        const resp = await server.inject({
            method: 'get',
            url: '/api/logout',
            headers: {
                Cookie: 'token=token',
            },
        })
        expect(resp.headers['set-cookie']).toMatchSnapshot()
        expect(resp.headers['location']).toMatchSnapshot()
        expect(resp.statusCode).toMatchSnapshot()
    })
})

describe('feed API', () => {
    test('/api/v1/feeds/add', async () => {
        const resp = await server.inject({
            method: 'put',
            url: '/api/v1/feeds/add',
            payload: {
                url: 'https://example.com/rss',
            },
            auth,
        })
        expect(resp.result).toMatchSnapshot()
    })

    test('/api/v1/feeds', async () => {
        const resp = await server.inject({
            method: 'get',
            url: '/api/v1/feeds',
            auth,
        })
        expect(resp.result).toMatchSnapshot()
    })

    test('/api/v1/feeds/export', async () => {
        const resp = await server.inject({
            method: 'get',
            url: '/api/v1/feeds/export',
            auth,
        })
        expect(resp.result).toMatchSnapshot()
    })

    test('/api/v1/feeds/import', async () => {
        const form = new FormData()
        const opml = `
            <?xml version="1.0" encoding="utf-8"?>
            <opml version="1.0">
            <head><title>feeds</title></head>
            <body>
            <outline type="rss" text="example" xmlUrl="https://example.com/rss2"/>
            <outline type="rss" text="example" xmlUrl="https://example.com/rss3"/>
            </body>
            </opml>
        `
        form.append('opml', opml, {
            filename: 'feed.opml',
            contentType: 'text/x-opml',
        })
        const resp = await server.inject({
            method: 'post',
            url: '/api/v1/feeds/import',
            auth,
            payload: form.getBuffer(),
            headers: form.getHeaders(),
        })
        expect(resp.result).toMatchSnapshot()
    })

    test('/api/v1/feeds/remove', async () => {
        const resp = await server.inject({
            method: 'delete',
            url: '/api/v1/feeds/remove',
            payload: {
                feedId: 1,
            },
            auth,
        })
        expect(resp.result).toMatchSnapshot()
    })
})

describe('model', () => {
    test('prepareFeedForUpdate', async () => {
        const feed = await model.prepareFeedForUpdate()
        expect(feed).toMatchSnapshot()
    })
    test('updateFeedUpdated', async () => {
        await model.updateFeedUpdated(3, new Date(1580601600000))
        const curr = await model.getFeedByUser(1)
        expect(curr).toMatchSnapshot()
    })
})
