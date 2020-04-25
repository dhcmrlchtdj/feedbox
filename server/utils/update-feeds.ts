import { model } from '../models'
import type { Feed } from '../models'
import { fetchFeed } from './fetch-feed'
import { parseFeed } from './parse-feed'
import type { FeedItem } from './parse-feed'
import { sendEmail } from './send-email'
import { telegramClient } from '../telegram/client'
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

type TTelegramChat = {
    chat_id: number
    text: string
}

export const updateFeeds = async () => {
    const chFeed = new Channel<Feed>(Infinity)
    const chFeedItem = new Channel<[Feed, FeedItem]>(Infinity)
    const chArticle = new Channel<[Feed, TArticle]>(Infinity)
    const chEmail = new Channel<TEmail>(Infinity)
    const chTelegramChat = new Channel<TTelegramChat>(Infinity)

    const feeds = await model.getActiveFeeds()
    chFeed.sendAll(feeds).then(() => chFeed.close())

    // feed => update database
    // feed => feed item
    chFeed
        .onReceive(10, async (doc) => {
            const url = doc.url
            const resp = await fetchFeed(url)
            if (resp.isNone) return
            const items = await parseFeed(url, resp.getExn())
            if (items.length === 0) return

            const oldLinks = await model.getLinks(doc.id)
            const linkSet = new Set(oldLinks)
            for (const item of items) {
                const link = item.origlink || item.link || item.guid
                if (linkSet.has(link)) continue
                linkSet.add(link)
                await chFeedItem.send([doc, item])
            }
            if (linkSet.size > oldLinks.length) {
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
        .onReceive(10, async ([doc, item]) => {
            const link = item.origlink || item.link || item.guid
            const title = item.title || 'unknown'
            const site = extractSite(doc.url)
            const content = item.description || item.summary || ''
            const article = {
                url: link,
                title: `"${title}" from "${site}"`,
                content: `${link}<br><br><br>${content}`,
            }

            await chArticle.send([doc, article])
        })
        .then(() => chArticle.close())

    // article => email/telegram
    chArticle
        .onReceive(10, async ([doc, article]) => {
            const users = await model.getSubscribers(doc.id)
            for (let user of users) {
                switch (user.type) {
                    case 'github':
                        await chEmail.send({
                            addr: user.info.email,
                            subject: article.title,
                            text: article.content,
                        })
                        break
                    case 'telegram':
                        await chTelegramChat.send({
                            chat_id: user.info.chatId,
                            text: article.url,
                        })
                        break
                }
            }
        })
        .then(() => {
            chEmail.close()
            chTelegramChat.close()
        })

    const t1 = chEmail.onReceive(10, async (email) => {
        await sendEmail(email.addr, email.subject, email.text)
    })
    const t2 = chTelegramChat.onReceive(10, async (msg) => {
        await telegramClient.send('sendMessage', msg)
    })
    await Promise.all([t1, t2])
}
