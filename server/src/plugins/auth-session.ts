import * as authCookie from 'hapi-auth-cookie'
import User from '../models/user'

const validate = async (_request, session) => {
    const user = await User.takeById(session.id)
    if (user) {
        return { valid: true, credentials: { userId: user.id } }
    } else {
        return { valid: false }
    }
}

export default async (server): Promise<void> => {
    await server.register(authCookie)

    server.auth.strategy('session', 'cookie', {
        cookie: {
            name: 'token',
            password: process.env.COOKIE_SECRET,
            ttl: 7 * 24 * 60 * 60 * 1000,
            path: '/api',
            clearInvalid: true,
            isSameSite: process.env.API === process.env.SITE ? 'Strict' : false,
            isSecure: process.env.NODE_ENV === 'production',
            isHttpOnly: true,
        },
        validateFunc: validate,
    })
}