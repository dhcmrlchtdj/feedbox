import { URL } from 'url'
import { basename } from 'path'

export const extractSite = (url: string): string => {
    const u = new URL(url)
    switch (u.hostname) {
        case 'feeds.feedburner.com':
            return `feedburner/${basename(u.pathname)}`
        case 'medium.com':
            return `medium/${basename(u.pathname)}`
        case 'dev.to':
            return `dev.to/${basename(u.pathname)}`
        case 'rsshub.app':
            return `rsshub${u.pathname}`
        case 'feed43.com':
            return `feed43/${basename(u.pathname)}`
        default:
            return u.hostname
    }
}
