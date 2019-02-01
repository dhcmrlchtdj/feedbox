import * as Url from 'url'
import * as Path from 'path'

const extractSite = (url: string): string => {
    const u = new Url.URL(url)
    switch (u.hostname) {
        case 'feeds.feedburner.com':
            return `feedburner/${Path.basename(u.pathname)}`
        case 'medium.com':
            return `medium/${Path.basename(u.pathname)}`
        default:
            return u.hostname
    }
}

export default extractSite
