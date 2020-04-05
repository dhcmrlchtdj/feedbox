import { model, Feed } from '../models'
import { fetchFeed } from './fetch-feed'
import { parseFeed, FeedItem } from './parse-feed'
// import { sendEmail } from './send-email'
import { extractSite } from './extract-site'
import { Channel } from '../../util/sync'

type TArticle = {
    url: string
    title: string
    content: string
}

type TEmail = {
    addr: string
    subject: string
    text: string
}

export const updateFeeds = async () => {
    const chFeedDoc = new Channel<Feed>(Infinity)
    const chFeedItem = new Channel<[Feed, FeedItem]>(Infinity)
    const chArticle = new Channel<[Feed, TArticle]>(Infinity)
    const chEmail = new Channel<TEmail>(Infinity)

    const feeds = await model.getActiveFeeds()
    chFeedDoc.sendAll(feeds).then(() => chFeedDoc.close())

    // feed => update database
    // feed => feed item
    chFeedDoc
        .onReceive(10, async (doc) => {
            const url = doc.url
            const resp = await fetchFeed(url)
            if (resp.isNone) return
            const items = await parseFeed(url, resp.getExn())
            if (items.length === 0) return

            const linkSet = new Set<string>(doc.links)
            for (const item of items) {
                const link = item.origlink || item.link || item.guid
                if (linkSet.has(link)) continue
                linkSet.add(link)
                await chFeedItem.send([doc, item])
            }
            if (linkSet.size > doc.links.length) {
                const links = Array.from(linkSet)
                const updated = (() => {
                    const first = items[0]
                    const dateSrc = first.date || first.meta.date || null
                    if (dateSrc !== null) {
                        try {
                            const date = new Date(dateSrc)
                            return date
                        } catch (err) {
                            console.error(err)
                        }
                    }
                    return new Date()
                })()
                await model.updateFeed(doc.id, links, updated)
            }
        })
        .then(() => chFeedItem.close())

    // feed item => article
    chFeedItem
        .onReceive(20, async ([doc, item]) => {
            const link = item.origlink || item.link || item.guid
            const title = item.title || 'unknown'
            const site = extractSite(doc.url)
            const content = item.description || item.summary || 'unknown'
            const article = {
                url: link,
                title: `"${title}" from "${site}"`,
                content: `${link}<br><br><br>${content}`,
            }

            await chArticle.send([doc, article])
        })
        .then(() => chArticle.close())

    // article => email
    chArticle
        .onReceive(20, async ([doc, article]) => {
            const users = await model.getSubscribers(doc.id)
            const emails: TEmail[] = users.map((user) => ({
                addr: user.email,
                subject: article.title,
                text: article.content,
            }))
            chEmail.sendAll(emails)
        })
        .then(() => chEmail.close())

    // email => send it
    await chEmail.onReceive(10, async (email) => {
        console.log(email.text)
        // await sendEmail(email.addr, email.subject, email.text)
    })
}
