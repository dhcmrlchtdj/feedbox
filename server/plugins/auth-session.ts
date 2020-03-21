import * as authCookie from '@hapi/cookie'
import { model } from '../models'

const ttl = 30 * 24 * 60 * 60 * 1000

const validate = async (_request, session) => {
    if (session.ts + ttl > Date.now()) {
        const user = await model.getUserById(session.id)
        if (user) {
            return { valid: true, credentials: { userId: user.id } }
        }
    }
    return { valid: false }
}

export const authSession = async server => {
    await server.register(authCookie)

    server.auth.strategy('session', 'cookie', {
        cookie: {
            name: 'token',
            password: process.env.COOKIE_SECRET,
            ttl: 7 * 24 * 60 * 60 * 1000,
            path: '/api',
            clearInvalid: true,
            isSameSite: 'Strict',
            isSecure: process.env.NODE_ENV === 'production',
            isHttpOnly: true,
        },
        validateFunc: validate,
    })
}
