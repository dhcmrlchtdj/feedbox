// import Model from '../models'
// import fetchFeed from './fetch-feed'
// import parseFeed, { FeedItem } from './parse-feed'
// import sendEmail from './send-email'
// import extractSite from './extract-site'
//
// type TEntry = {
//     url: string
//     title: string
//     content: string
// }
//
// type TMail = {
//     addr: string
//     subject: string
//     text: string
// }
//
// const feed2feeds = async (feed: Feed): Promise<FeedItem[]> => {
//     const url = feed.url
//
//     console.debug(`${url} - fetching`)
//     const resp = await fetchFeed(url)
//     console.debug(`${url} - fetched`)
//
//     if (!resp) return []
//     const feeds = await parseFeed(url, resp)
//     return feeds
// }
//
// const feed2link = (feed: FeedItem): string => {
//     return feed.origlink || feed.link || feed.guid
// }
// const feeds2entries = async (
//     feed: Feed,
//     feeds: FeedItem[],
// ): Promise<TEntry[]> => {
//     const prevLinks = new Set(feed.links.map(x => x.url))
//     const entries = feeds
//         .filter(m => !prevLinks.has(feed2link(m)))
//         .map(m => {
//             const title = m.title || 'unknown'
//             const site = extractSite(feed.url)
//             const link = feed2link(m)
//             const article = m.description || m.summary || 'unknown'
//             return {
//                 url: link,
//                 title: `"${title}" from "${site}"`,
//                 content: `${link}<br><br><br>${article}`,
//             }
//         })
//     return entries
// }
//
// const entries2mails = async (
//     feed: Feed,
//     entries: TEntry[],
// ): Promise<TMail[]> => {
//     const users = feed.users
//     const mails = entries.map(entry => {
//         const ms = users.map(user => ({
//             addr: user.email,
//             subject: entry.title,
//             text: entry.content,
//         }))
//         return ms
//     })
//     return mails.flat()
// }
//
// const updateFeeds = async () => {
//     const feeds = await Model.getFeedForUpdate()
//     feeds.forEach(async feed => {
//         // fetch feeds
//         // const f = await feed2feeds(feed)
//
//         // update db
//         // feed.lastCheck = new Date()
//         // if (f.length !== 0) {
//         //     const first = f[0]
//         //     feed.lastUpdated = first.date || first.meta.date || new Date()
//         // }
//
//         // extract articles
//         // const e = await feeds2entries(feed, f)
//         //
//         // // update db
//         // // FIXME: how to batch?
//         // await Promise.all(
//         //     e.map(async x => {
//         //         const l = new Link()
//         //         l.url = x.url
//         //         await l.save()
//         //         feed.links.push(l)
//         //     }),
//         // )
//         // await feed.save()
//         //
//         // // send emails
//         // const m = await entries2mails(feed, e)
//         // await Promise.all(m.map(x => sendEmail(x.addr, x.subject, x.text)))
//     })
// }
//
// export default updateFeeds
export default '' as any
