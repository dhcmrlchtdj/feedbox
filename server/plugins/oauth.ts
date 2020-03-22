import * as bell from '@hapi/bell'

export const initOAuth = async (server) => {
    await server.register(bell)

    server.auth.strategy('github', 'bell', {
        provider: 'github',
        password: process.env.GITHUB_AUTH_SECRET,
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        forceHttps: process.env.NODE_ENV === 'production',
        location: process.env.SERVER,
        isSecure: process.env.NODE_ENV === 'production',
    })
}
