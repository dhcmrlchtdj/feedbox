import logger from './logger'
import rollbar from './rollbar'
import authSession from './auth-session'
import OAuth from './oauth'

const register = async server => {
    await server.register(logger)
    await server.register(rollbar)

    await authSession(server)
    server.auth.default('session')

    await OAuth(server)
}

export default register
