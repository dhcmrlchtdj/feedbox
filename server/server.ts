import './init-env'
import * as path from 'path'
import * as Hapi from '@hapi/hapi'
import { addPlugins } from './plugins'
import { routes } from './routes'
import { model } from './models'
import { telegramBot } from './telegram/bot'

const common = async () => {
    const server = Hapi.server({
        port: Number(process.env.PORT || 8000),
        host: '0.0.0.0',
        routes: {
            payload: { allow: 'application/json' },
            files: {
                relativeTo: path.resolve(__dirname, '../static'),
            },
        },
    })
    await addPlugins(server)
    server.route(routes)

    server.events.on('stop', async () => {
        await model.destroy()
    })

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

    if (process.env.NODE_ENV === 'production') {
        // init telegram webhook
        await telegramBot.registerWebhook()
    }

    return server
}
