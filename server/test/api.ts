import { init } from '../lib/server'
import User from '../lib/models/user'

let server: any
let userId: number
beforeAll(async () => {
    server = await init()
    const user = await User.takeOrCreateByGithub(1, 'user@example.com')
    userId = user.id
})
afterAll(async () => {
    await server.stop()
})

describe('user API', () => {
    test('/api/v1/user', async () => {
        const resp = await server.inject({
            method: 'get',
            url: '/api/v1/user',
            auth: {
                strategy: 'session',
                credentials: { userId },
            },
        })
        expect(resp.result).toMatchInlineSnapshot(`
            User {
              "email": "user@example.com",
              "githubId": 1,
              "id": 1,
            }
        `)
    })

    test('/api/logout', async () => {
        const resp = await server.inject({
            method: 'get',
            url: '/api/logout',
            headers: {
                Cookie: 'token=***',
            },
        })
        expect(resp.headers['set-cookie']).toMatchInlineSnapshot(`
            Array [
              "token=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/api",
            ]
        `)
        expect(resp.headers['location']).toMatchInlineSnapshot(
            `"http://localhost:9000"`,
        )
        expect(resp.statusCode).toMatchInlineSnapshot(`302`)
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
            auth: {
                strategy: 'session',
                credentials: { userId },
            },
        })
        expect(resp.result).toMatchInlineSnapshot(`
            Array [
              Feed {
                "id": 1,
                "lastCheck": null,
                "lastUpdated": null,
                "url": "https://example.com/rss",
              },
            ]
        `)
    })

    test('/api/v1/feeds', async () => {
        const resp = await server.inject({
            method: 'get',
            url: '/api/v1/feeds',
            auth: {
                strategy: 'session',
                credentials: { userId },
            },
        })
        expect(resp.result).toMatchInlineSnapshot(`
            Array [
              Feed {
                "id": 1,
                "lastCheck": null,
                "lastUpdated": null,
                "url": "https://example.com/rss",
              },
            ]
        `)
    })

    test('/api/v1/feeds/export', async () => {
        const resp = await server.inject({
            method: 'get',
            url: '/api/v1/feeds/export',
            auth: {
                strategy: 'session',
                credentials: { userId },
            },
        })
        expect(resp.result).toMatchInlineSnapshot(`
            "<?xml version=\\"1.0\\" encoding=\\"utf-8\\"?>
            <opml version=\\"1.0\\">
            <head><title>feeds</title></head>
            <body>
            <outline type=\\"rss\\" text=\\"example.com\\" xmlUrl=\\"https://example.com/rss\\"/>
            </body>
            </opml>"
        `)
    })

    test('/api/v1/feeds/remove', async () => {
        const resp = await server.inject({
            method: 'delete',
            url: '/api/v1/feeds/remove',
            payload: {
                feedId: 1,
            },
            auth: {
                strategy: 'session',
                credentials: { userId },
            },
        })
        expect(resp.result).toMatchInlineSnapshot(`Array []`)
    })
})
