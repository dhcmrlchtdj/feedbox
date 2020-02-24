import { model, FeedDoc } from '../models'
import { fetchFeed } from './fetch-feed'
import { parseFeed, FeedItem } from './parse-feed'
import { sendEmail } from './send-email'
import { extractSite } from './extract-site'
import { Channel } from './sync'

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
    const chFeedDoc = new Channel<FeedDoc>(Infinity)
    const chFeedItem = new Channel<[FeedDoc, FeedItem]>(Infinity)
    const chArticle = new Channel<[FeedDoc, TArticle]>(Infinity)
    const chEmail = new Channel<[TEmail, number]>(Infinity)

    const feeds = await model.prepareFeedForUpdate()
    await chFeedDoc.sendAll(feeds)
    chFeedDoc.close()

    // feed doc => DB feed updated_at
    // feed doc => feed item
    chFeedDoc
        .onReceive(10, async doc => {
            const url = doc.url
            const resp = await fetchFeed(url)
            if (!resp) return
            const items = await parseFeed(url, resp)

            // updated_at
            if (items.length > 0) {
                const first = items[0]
                const dateSrc = first.date || first.meta.date || null
                if (dateSrc !== null) {
                    try {
                        const date = new Date(dateSrc)
                        await model.updateFeedUpdated(doc.id, date)
                    } catch (err) {
                        console.error(err)
                    }
                } else {
                    const link = first.origlink || first.link || first.guid
                    if (!doc.links.has(link)) {
                        await model.updateFeedUpdated(doc.id, new Date())
                    }
                }
            }

            for (const item of items) {
                await chFeedItem.send([doc, item])
            }
        })
        .then(() => chFeedItem.close())

    // feed item => article
    // feed item => save link to DB
    chFeedItem
        .onReceive(20, async ([doc, item]) => {
            const link = item.origlink || item.link || item.guid
            if (doc.links.has(link)) return

            const title = item.title || 'unknown'
            const site = extractSite(doc.url)
            const content = item.description || item.summary || 'unknown'
            const article = {
                url: link,
                title: `"${title}" from "${site}"`,
                content: `${link}<br><br><br>${content}`,
            }

            await chArticle.send([doc, article])
            await model.addLink(doc.id, link)
        })
        .then(() => chArticle.close())

    // article => email
    chArticle
        .onReceive(20, async ([doc, article]) => {
            const emails: [TEmail, number][] = doc.emails.map(addr => [
                {
                    addr,
                    subject: article.title,
                    text: article.content,
                },
                0,
            ])
            chEmail.sendAll(emails)
        })
        .then(() => chEmail.close())

    // email => send it
    await chEmail.onReceive(10, async ([email, retry]) => {
        if (retry < 3) {
            const success = await sendEmail(
                email.addr,
                email.subject,
                email.text,
            )
            if (success) return
            chEmail.send([email, retry + 1])
        } else {
            return
        }
    })
}
