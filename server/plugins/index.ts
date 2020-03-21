import { logger } from './logger'
import { errorReporter } from './error-reporter'
import { authSession } from './auth-session'
import { OAuth } from './oauth'
import * as inert from '@hapi/inert'

export const addPlugins = async server => {
    await server.register(logger)
    await server.register(errorReporter)

    await authSession(server)
    server.auth.default('session')

    await OAuth(server)

    await server.register(inert)
}
