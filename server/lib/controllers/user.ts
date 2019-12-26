import * as Boom from '@hapi/boom'
import Model from '../models'
import getGithubEmail from '../utils/get-github-email'

export const info = {
    async handler(request, _h) {
        const { userId } = request.auth.credentials
        const user = await Model.getUserById(userId)
        if (user) {
            return user
        } else {
            return Boom.badRequest('invalid user')
        }
    },
}

export const logout = {
    auth: false,
    async handler(request, h) {
        request.cookieAuth.clear()
        return h.redirect(process.env.WEB)
    },
}

export const connectGithub = {
    auth: 'github',
    async handler(request, h) {
        if (request.auth.isAuthenticated) {
            // oauth
            const credentials = request.auth.credentials

            // get/create user
            const github = credentials.profile
            if (!github.email) {
                github.email = await getGithubEmail(credentials.token)
            }
            const id = await Model.getUserIdByGithub(github.id, github.email)

            // set cookie
            request.cookieAuth.set({ id })

            // redirect to home
            return h.redirect(process.env.WEB)
        } else {
            const errMsg = request.auth.error.message
            return `Authentication failed due to: ${errMsg}`
        }
    },
}
