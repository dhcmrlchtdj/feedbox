import * as chardet from 'jschardet'
import * as iconv from 'iconv-lite'
import fetch from 'node-fetch'
import { rollbar } from './rollbar'
import { Option, Some, None } from './option'

export const fetchFeed = async (feedurl: string): Promise<Option<string>> => {
    const content = await fetch(feedurl, {
        headers: { 'user-agent': 'feedbox.h11.io' },
    })
        .then(res => {
            if (res.ok) {
                return res.buffer()
            } else {
                throw new Error(`${res.status}`)
            }
        })
        .then(buf => {
            const encoding = chardet.detect(buf).encoding
            if (encoding === 'utf8') {
                return Some(buf.toString())
            } else {
                return Some(iconv.decode(buf, encoding))
            }
        })
        .catch(err => {
            rollbar.info(err, { feedurl })
            return None
        })
    return content
}
