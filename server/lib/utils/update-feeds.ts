import { model, FeedDoc } from '../models'
import { fetchFeed } from './fetch-feed'
import { parseFeed, FeedItem } from './parse-feed'
import { sendEmails } from './send-email'
import { extractSite } from './extract-site'
import { rollbar } from './rollbar'

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

    // extract new articles
    const entries = await feeds2entries(fdoc, feeds)
    const newLinks = entries.map(x => ({ feed_id: fdoc.id, url: x.url }))

    // mails
    const mails = await entries2mails(fdoc, entries)

    // update feed.updated time
    if (feeds.length > 0) {
        const first = feeds[0]
        const dateSrc = first.date || first.meta.date || null
        if (dateSrc !== null) {
            try {
                const date = new Date(dateSrc)
                await model.updateFeedUpdated(fdoc.id, date)
            } catch (err) {
                rollbar.info(err, { feedurl: fdoc.url })
            }
        } else if (newLinks.length > 0) {
            await model.updateFeedUpdated(fdoc.id, new Date())
        }
    }

    return {
        newLinks,
        mails,
    }
}

export const updateFeeds = async () => {
    const feeds = await model.prepareFeedForUpdate()
    const data = await Promise.all(feeds.map(async fdoc => fdoc2xxx(fdoc)))
    // update link data
    const links = data.flatMap(x => x.newLinks)
    await model.addLinks(links)
    // send emails
    const mails = data.flatMap(x => x.mails)
    await sendEmails(mails)
}
