import { model } from '../models'
import type { Feed } from '../models'
import { Some, None } from './option'
import type { Option } from './option'
import { parseFeed } from './parse-feed'
import type { FeedItem } from './parse-feed'
import { fetchFeed } from './fetch-feed'

export const getNewFeeds = async (
    feed: Feed,
): Promise<
    Option<{ updated: Date; newLinks: string[]; newItems: FeedItem[] }>
> => {
    const url = feed.url
    const resp = await fetchFeed(url)
    if (resp.isNone) return None

    const items = await parseFeed(url, resp.getExn())
    if (items.length === 0) return None

    const oldLinks = await model.getLinks(feed.id)
    const linkSet = new Set(oldLinks)
    const newLinks: string[] = []
    const newItems: FeedItem[] = []
    for (const item of items) {
        const link = item.origlink || item.link || item.guid
        if (!linkSet.has(link)) {
            linkSet.add(link)
            newLinks.push(link)
            newItems.push(item)
        }
    }
    if (newItems.length === 0) return None

    const updated = (() => {
        const first = items[0]
        const date = first.date || first.meta.date
        if (
            date instanceof Date &&
            !Number.isNaN(date.getTime()) // Invalid Date
        ) {
            return date
        } else {
            return new Date()
        }
    })()

    return Some({ updated, newItems, newLinks })
}
