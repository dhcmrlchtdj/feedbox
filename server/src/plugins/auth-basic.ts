import * as authBasic from '@hapi/basic'
import * as Boom from '@hapi/boom'

const validate = async (_request, username: string, password: string, h) => {
    if (
        username === process.env.CRON_USERNAME &&
        password === process.env.CRON_PASSWORD
    ) {
        return { isValid: true, credentials: { username } }
    } else {
        return h.unauthenticated(Boom.unauthorized(null, 'basic'))
    }
}

export default async server => {
    await server.register(authBasic)
    server.auth.strategy('cron', 'basic', { validate })
}
