import { PassThrough } from 'stream'
import * as FeedParser from 'feedparser'
import { rollbar } from './rollbar'

type FeedItem = FeedParser.Item
export { FeedItem }

export const parseFeed = async (
    feedurl: string,
    content: string,
): Promise<FeedItem[]> => {
    return new Promise<FeedItem[]>(resolve => {
        const feedparser = new FeedParser({ feedurl })
        const feed: FeedItem[] = []

        feedparser.on('end', () => resolve(feed))
        feedparser.on('error', err => {
            rollbar.info(err, { feedurl })
            resolve([])
        })
        feedparser.on('readable', function(this: any) {
            let item = this.read()
            while (item) {
                feed.push(item)
                item = this.read()
            }
        })

        const pass = new PassThrough()
        pass.pipe(feedparser)
        pass.end(content)
    })
}
