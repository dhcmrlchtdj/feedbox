import { model, FeedDoc } from '../models'
import fetchFeed from './fetch-feed'
import parseFeed, { FeedItem } from './parse-feed'
import { sendEmail } from './send-email'
import extractSite from './extract-site'
import { Channel } from './sync'

// import rollbar from './rollbar'

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

const chFeedDoc = new Channel<FeedDoc>(20)
const chFeedItem = new Channel<[FeedDoc, FeedItem]>(20)
const chArticle = new Channel<[FeedDoc, TArticle]>(20)
const chEmail = new Channel<[TEmail, number]>(20)

// feed doc => DB feed updated_at
// feed doc => feed item
chFeedDoc.onReceive(async doc => {
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

// feed item => article
// feed item => save link to DB
chFeedItem.onReceive(async ([doc, item]) => {
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

// article => email
chArticle.onReceive(async ([doc, article]) => {
    const emails = doc.emails.map(addr => ({
        addr,
        subject: article.title,
        text: article.content,
    }))
    for (const x of emails) {
        await chEmail.send([x, 0])
    }
})

// email => send it
chEmail.onReceive(async ([email, retry]) => {
    if (retry < 3) {
        const success = await sendEmail(email.addr, email.subject, email.text)
        if (success) return
        chEmail.send([email, retry + 1])
    } else {
        return
    }
})

export const updateFeeds = async () => {
    const feeds = await model.prepareFeedForUpdate()
    await chFeedDoc.sendAll(feeds)
}
