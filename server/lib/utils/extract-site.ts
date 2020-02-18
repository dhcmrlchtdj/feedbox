import * as Url from 'url'
import * as Path from 'path'

export const extractSite = (url: string): string => {
    const u = new Url.URL(url)
    switch (u.hostname) {
        case 'feeds.feedburner.com':
            return `feedburner/${Path.basename(u.pathname)}`
        case 'medium.com':
            return `medium/${Path.basename(u.pathname)}`
        case 'dev.to':
            return `dev.to/${Path.basename(u.pathname)}`
        case 'rsshub.app':
            return `rsshub${u.pathname}`
        default:
            return u.hostname
    }
}
