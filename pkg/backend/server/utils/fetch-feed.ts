import * as chardet from 'chardet'
import * as iconv from 'iconv-lite'
import fetch from 'node-fetch'
import { report } from './error-reporter'
import { Option, Some, None } from '../../../common/option'

export const fetchFeed = async (feedurl: string): Promise<Option<string>> => {
    return fetch(feedurl, {
        headers: { 'user-agent': 'feedbox.h11.io' },
    })
        .then(async (resp) => {
            if (!resp.ok) throw new Error(resp.status.toString())
            const buf = await resp.buffer()
            const encoding = chardet.detect(buf) ?? 'UTF-8'
            if (encoding === 'UTF-8') {
                return Some(buf.toString())
            } else {
                return Some(iconv.decode(buf, encoding))
            }
        })
        .catch((err) => {
            report.err(err, { feedurl })
            return None
        })
}
