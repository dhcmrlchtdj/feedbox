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
        expect(resp.result).toMatchSnapshot()
    })

    test('/api/logout', async () => {
        const resp = await server.inject({
            method: 'get',
            url: '/api/logout',
            headers: {
                Cookie: 'token=***',
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
            auth: {
                strategy: 'session',
                credentials: { userId },
            },
        })
        expect(resp.result).toMatchSnapshot()
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
        expect(resp.result).toMatchSnapshot()
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
        expect(resp.result).toMatchSnapshot()
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
        expect(resp.result).toMatchSnapshot()
    })
})
