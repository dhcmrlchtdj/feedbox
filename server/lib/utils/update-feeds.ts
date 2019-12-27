import Model, { FeedDoc } from '../models'
import fetchFeed from './fetch-feed'
import parseFeed, { FeedItem } from './parse-feed'
import sendEmail from './send-email'
import extractSite from './extract-site'

type TEntry = {
    url: string
    title: string
    content: string
}

type TMail = {
    addr: string
    subject: string
    text: string
}

const fdoc2feeds = async (fdoc: FeedDoc): Promise<FeedItem[]> => {
    const url = fdoc.url

    console.debug(`${url} - fetching`)
    const resp = await fetchFeed(url)
    console.debug(`${url} - fetched`)

    if (!resp) return []
    const feeds = await parseFeed(url, resp)
    return feeds
}

const feed2link = (feed: FeedItem): string => {
    return feed.origlink || feed.link || feed.guid
}

const feeds2entries = async (
    fdoc: FeedDoc,
    feeds: FeedItem[],
): Promise<TEntry[]> => {
    const entries = feeds
        .filter(m => !fdoc.links.has(feed2link(m)))
        .map(m => {
            const title = m.title || 'unknown'
            const site = extractSite(fdoc.url)
            const link = feed2link(m)
            const article = m.description || m.summary || 'unknown'
            return {
                url: link,
                title: `"${title}" from "${site}"`,
                content: `${link}<br><br><br>${article}`,
            }
        })
    return entries
}

const entries2mails = async (
    fdoc: FeedDoc,
    entries: TEntry[],
): Promise<TMail[]> => {
    const mails = entries.flatMap(entry => {
        return fdoc.emails.map(addr => ({
            addr,
            subject: entry.title,
            text: entry.content,
        }))
    })
    return mails
}

const fdoc2xxx = async (fdoc: FeedDoc) => {
    // fetch feeds && latest updated time
    const feeds = await fdoc2feeds(fdoc)
    const updated = { id: fdoc.id, updated: null as Date | null }
    if (feeds.length > 0) {
        const first = feeds[0]
        const date = first.date || first.meta.date || null
        updated.updated = date
    }

    // extract articles && new links
    const entries = await feeds2entries(fdoc, feeds)
    const newLinks = entries.map(x => ({ feed_id: fdoc.id, url: x.url }))

    // mails
    const mails = await entries2mails(fdoc, entries)

    return {
        updated,
        newLinks,
        mails,
    }
}

const updateFeeds = async () => {
    const feeds = await Model.prepareFeedForUpdate()
    const data = await Promise.all(feeds.map(async fdoc => fdoc2xxx(fdoc)))
    // update link data
    const links = data.flatMap(x => x.newLinks)
    await Model.addLinks(links)
    // update feed.updated time
    const updated = data.map(x => x.updated)
    await Model.updateFeedUpdated(updated)
    // send emails
    const mails = data.flatMap(x => x.mails)
    await Promise.all(mails.map(x => sendEmail(x.addr, x.subject, x.text)))
}

export default updateFeeds
