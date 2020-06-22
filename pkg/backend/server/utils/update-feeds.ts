import { model } from '../models'
import type { Feed, GithubUser, TelegramUser } from '../models'
import { fetchFeed } from './fetch-feed'
import { parseFeed } from './parse-feed'
import type { FeedItem } from './parse-feed'
import { sendEmail } from './send-email'
import { telegramClient } from '../telegram/client'
import { extractSite } from './extract-site'
import { Channel } from './sync'

export const updateFeeds = async () => {
    const chFeed = new Channel<Feed>(200)
    const chFeedItem = new Channel<[Feed, FeedItem]>(20)
    const chEmail = new Channel<[Feed, FeedItem, GithubUser[]]>(20)
    const chTelegram = new Channel<[FeedItem, TelegramUser[]]>(20)

    const feeds = await model.getActiveFeeds()
    chFeed.sendAll(feeds).then(() => chFeed.close())

    // feed => update database
    // feed => feedItem
    chFeed
        .onReceive(10, async (feed) => {
            const url = feed.url
            const resp = await fetchFeed(url)
            if (resp.isNone) return
            const items = await parseFeed(url, resp.getExn())
            if (items.length === 0) return

            const oldLinks = await model.getLinks(feed.id)
            const linkSet = new Set(oldLinks)
            for (const item of items) {
                const link = item.origlink || item.link || item.guid
                if (linkSet.has(link)) continue
                linkSet.add(link)
                await chFeedItem.send([feed, item])
            }

            if (linkSet.size > oldLinks.length) {
                const links = Array.from(linkSet)
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
                await model.updateFeed(feed.id, links, updated)
            }
        })
        .then(() => chFeedItem.close())

    // feedItem => email/telegram
    chFeedItem
        .onReceive(10, async ([feed, item]) => {
            const users = await model.getSubscribers(feed.id)
            const githubUsers = users.filter(
                (u) => u.platform === 'github',
            ) as GithubUser[]
            await chEmail.send([feed, item, githubUsers])

            const telegramUsers = users.filter(
                (u) => u.platform === 'telegram',
            ) as TelegramUser[]
            await chTelegram.send([item, telegramUsers])
        })
        .then(() => {
            chEmail.close()
            chTelegram.close()
        })

    const t1 = chEmail.onReceive(10, async ([feed, item, users]) => {
        const title = item.title || 'unknown'
        const site = extractSite(feed.url)
        const subject = `"${title}" from "${site}"`

        const link = item.origlink || item.link || item.guid
        const tags = item.categories.map((tag) => `#${tag}`).join(' ')
        const content = item.description || item.summary || ''
        const text = [link, tags, content].filter(Boolean).join('<br><br>')

        for (let user of users) {
            await sendEmail(user.addition.email, subject, text)
        }
    })

    const t2 = chTelegram.onReceive(10, async ([item, users]) => {
        const text: string[] = []

        const link = item.origlink || item.link || item.guid
        text.push(link)

        if (item.categories.length > 0) {
            const tags = item.categories.map((tag) => `#${tag}`).join(' ')
            text.push(tags)
        }

        if (item.comments) {
            text.push(`comments: ${item.comments}`)
        }

        for (let user of users) {
            await telegramClient.send('sendMessage', {
                chat_id: Number(user.pid),
                text: text.join('\n\n'),
            })
        }
    })

    await Promise.all([t1, t2])
}
