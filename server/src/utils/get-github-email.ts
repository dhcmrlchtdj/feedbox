import fetch from 'node-fetch'
import Boom from '@hapi/boom'

// https://developer.github.com/v3/users/emails/#list-email-addresses-for-a-user
type GitHubEmail = {
    email: string
    primary: boolean
    verified: boolean
    visibility: null | 'public'
}

const getGithubEmail = async (token: string): Promise<string> => {
    const emails: GitHubEmail[] = await fetch(
        'https://api.github.com/user/emails',
        { headers: { authorization: `token ${token}` } },
    ).then(res => res.json())

    const verifiedPrimary = emails.find(e => e.primary && e.verified)
    if (verifiedPrimary) return verifiedPrimary.email

    const verified = emails.find(e => e.verified)
    if (verified) return verified.email

    const msg = "user doesn't have any verified email."
    throw Boom.unauthorized(msg)
}

export default getGithubEmail
