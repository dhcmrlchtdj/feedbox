import * as cookieAuth from '@hapi/cookie'
import { model } from '../models'

// 7 days
const ttl = 7 * 24 * 60 * 60 * 1000

const validate = async (_request, session: { id: number; ts: number }) => {
    if (session.ts + ttl > Date.now()) {
        const user = await model.getUserById(session.id)
        if (user) {
            return { valid: true, credentials: { userId: user.id } }
        }
    }
    return { valid: false }
}

export const initSession = async (server) => {
    await server.register(cookieAuth)

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
        requestDecoratorName: 'session',
    })
}
