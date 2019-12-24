import * as Hapi from '@hapi/hapi'
import plugins from './plugins'
import routes from './routes'
import prepare from './prepare'

const common = async () => {
    await prepare()

    const corsConf = {
        headers: [
            'accept',
            'authorization',
            'content-type',
            'if-none-match',
            'content-type',
            'x-sw-strategy',
            'x-sw-race',
            'x-sw-actions',
        ],
        credentials: true,
    }
    const server = Hapi.server({
        port: Number(process.env.PORT || 8000),
        host: '0.0.0.0',
        routes: {
            payload: { allow: ['application/json'] },
            cors: process.env.SERVER === process.env.WEB ? false : corsConf,
        },
    })
    await plugins(server)
    server.route(routes)

    return server
}

export const init = async () => {
    const server = await common()
    server.initialize()
    return server
}

export const start = async () => {
    const server = await common()
    server.start()
    return server
}
