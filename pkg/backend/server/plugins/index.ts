import { logger } from './logger'
import { errorReporter } from './error-reporter'
import { initSession } from './session'
import { initOAuth } from './oauth'
import * as inert from '@hapi/inert'

export const addPlugins = async (server) => {
    await server.register(inert)
    if (process.env.DISABLE_LOGGER !== 'true') {
        await server.register(logger)
    }
    await server.register(errorReporter)

    await initOAuth(server)
    await initSession(server)
    server.auth.default('session')
}
