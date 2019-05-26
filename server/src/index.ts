import prepare from './prepare'
import * as Hapi from '@hapi/hapi'
import plugins from './plugins'
import routes from './routes'

const corsConf = {
    headers: [
        'Accept',
        'Authorization',
        'Content-Type',
        'If-None-Match',
        'Content-Type',
        'X-SW-Strategy',
        'X-SW-Race',
        'X-SW-Action',
    ],
    credentials: true,
}

const main = async () => {
    await prepare()

    const server = Hapi.server({
        host: '0.0.0.0',
        port: Number(process.env.PORT || 8000),
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
