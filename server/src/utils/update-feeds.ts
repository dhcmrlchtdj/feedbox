import Feed from '../models/feed'
import fetch from 'node-fetch'
import parseFeed, { FeedItem } from './parse-feed'
import sendEmail from './send-email'
import extractSite from './extract-site'

type Tfeeds = {
    feed: Feed
    prev: FeedItem[]
    curr: FeedItem[]
    currText: string
}
type Tentries = {
    feed: Feed
    entries: Array<{
        title: string
        content: string
    }>
}
type Tmail = {
    addr: string
    subject: string
    text: string
}

const feed2feeds = async (feed: Feed): Promise<Tfeeds | null> => {
    const url = feed.url
    console.debug(`${url} - fetching`)
    const curr = await fetch(url, {
        headers: { 'user-agent': 'feedbox.h11.io' },
    })
        .then(res => res.text())
        .catch(err => {
            console.error(err)
            return null
        })

    console.debug(`${url} - fetched`)
    if (!curr) return null
    if (curr === feed.content) {
        console.debug(`${url} - no change`)
        return null
    }

    const currFeed = await parseFeed(url, curr)
    if (currFeed.length === 0) {
        console.debug(`${url} - no content`)
        return null
    }

    console.debug(`${url} - processing`)

    let prevFeed: FeedItem[] = []
    if (feed.content) prevFeed = await parseFeed(url, feed.content)
    return {
        feed,
        prev: prevFeed,
        curr: currFeed,
        currText: curr,
    }
}

const feed2link = (feed: FeedItem): string => {
    return feed.origlink || feed.link || feed.guid
}

const feeds2entries = async (feeds: Tfeeds): Promise<Tentries | null> => {
    const prevLinks = new Set(feeds.prev.map(m => feed2link(m)))
    const entries = feeds.curr
        .filter(m => !prevLinks.has(feed2link(m)))
        .map(m => {
            const title = m.title || 'unknown'
            const site = extractSite(feeds.feed.url)
            const link = feed2link(m)
            const article = m.description || m.summary || 'unknown'
            return {
                title: `"${title}" from "${site}"`,
                content: `${link}<br><br><br>${article}`,
            }
        })
    if (entries.length === 0) return null
    return { feed: feeds.feed, entries }
}

const entries2mails = async (entries: Tentries): Promise<Tmail[]> => {
    const users = entries.feed.users
    const mails = entries.entries.map(entry => {
        const ms = users.map(user => ({
            addr: user.email,
            subject: entry.title,
            text: entry.content,
        }))
        return ms
    })
    const flatten = ([] as Tmail[]).concat(...mails)
    return flatten
}

const updateFeeds = async () => {
    const feeds = await Feed.takeAll()
    feeds.forEach(async feed => {
        // fetch feed
        const f = await feed2feeds(feed)

        // save state
        feed.lastCheck = new Date()
        if (f) {
            // invalid byte sequence for encoding "UTF8": 0x00
            feed.content = f.currText.replace(/\0/g, '')
            feed.lastUpdated = f.curr[0].date || new Date()
        }
        await feed.save()

        // no content
        if (!f) return
        // first time
        if (f.prev.length === 0) return

        // extract entry
        const e = await feeds2entries(f)
        if (!e) return

        // send email
        const m = await entries2mails(e)
        const s = m.map(m => sendEmail(m.addr, m.subject, m.text))
        await Promise.all(s)
    })
}

export default updateFeeds
