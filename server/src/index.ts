import prepare from './prepare'
import { Server } from '@hapi/hapi'
import plugins from './plugins'
import routes from './routes'

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

const main = async () => {
    await prepare()

    const server = new Server({
        port: Number(process.env.PORT || 8000),
        host: '0.0.0.0',
        routes: {
            payload: { allow: ['application/json'] },
            cors: process.env.API === process.env.SITE ? false : corsConf,
        },
    })

    await plugins(server)

    server.route(routes)

    await server.start()
}

main()
