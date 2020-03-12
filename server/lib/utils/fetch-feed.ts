import * as chardet from 'jschardet'
import * as iconv from 'iconv-lite'
import fetch from 'node-fetch'
import { rollbar } from './rollbar'
import { Option, Some, None } from './option'

const fetchFeed = async (feedurl: string): Promise<Option<string>> => {
    const resp = await fetch(feedurl, {
        headers: { 'user-agent': 'feedbox.h11.io' },
    })
    if (!resp.ok) throw new Error(resp.status.toString())
    const buf = await resp.buffer()
    const encoding = chardet.detect(buf).encoding
    if (encoding === 'utf8') {
        return Some(buf.toString())
    } else {
        return Some(iconv.decode(buf, encoding))
    }
}

export const fetchFeedWithRetry = async (
    feedurl: string,
    maxRetry: number,
): Promise<Option<string>> => {
    let err
    let count = 1
    while (count <= maxRetry) {
        try {
            const feed = await fetchFeed(feedurl)
            return feed
        } catch (e) {
            err = e
        }
        count++
    }
    rollbar.info(err, { feedurl })
    return None
}
