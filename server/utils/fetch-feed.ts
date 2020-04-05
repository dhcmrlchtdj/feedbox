import * as chardet from 'jschardet'
import * as iconv from 'iconv-lite'
import fetch from 'node-fetch'
import { rollbar } from './rollbar'
import { Option, Some, None } from '../../util/option'

export const fetchFeed = async (feedurl: string): Promise<Option<string>> => {
    return fetch(feedurl, {
        headers: { 'user-agent': 'feedbox.h11.io' },
    })
        .then(async (resp) => {
            if (!resp.ok) throw new Error(resp.status.toString())
            const buf = await resp.buffer()
            const encoding = chardet.detect(buf).encoding || 'utf8'
            if (encoding === 'utf8') {
                return Some(buf.toString())
            } else {
                return Some(iconv.decode(buf, encoding))
            }
        })
        .catch((err) => {
            rollbar.info(err, { feedurl })
            return None
        })
}
