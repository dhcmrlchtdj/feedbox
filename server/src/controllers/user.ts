import User from '../models/user'
import getGithubEmail from '../utils/get-github-email'

export const info = {
    async handler(request, _h) {
        const { userId } = request.auth.credentials
        const user = await User.takeById(userId)
        return user
    },
}

export const logout = {
    auth: false,
    async handler(request, h) {
        request.cookieAuth.clear()

        // redirect to home
        return h.redirect(process.env.WEB)
    },
}

export const connectGithub = {
    auth: 'github',
    async handler(request, h) {
        if (request.auth.isAuthenticated) {
            // oauth
            const credentials = request.auth.credentials
            const profile = credentials.profile
            if (!profile.email) {
                profile.email = await getGithubEmail(credentials.token)
            }

            // get/create user
            const user = await User.takeOrCreateByGithub(
                profile.id,
                profile.email,
            )

            // set cookie
            request.cookieAuth.set({ id: user.id })

            // redirect to home
            return h.redirect(process.env.WEB)
        } else {
            const errMsg = request.auth.error.message
            return `Authentication failed due to: ${errMsg}`
        }
    },
}
