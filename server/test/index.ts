import { init } from '../lib/server'

let server: any = null

beforeEach(async () => {
    server = await init()
})
afterEach(async () => {
    await server.stop()
})

test('/', async () => {
    const res = await server.inject({
        method: 'get',
        url: '/',
    })
    expect(res.statusCode).toBe(404)
})
