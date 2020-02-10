import * as chardet from 'jschardet'
import * as iconv from 'iconv-lite'
import fetch from 'node-fetch'
// import rollbar from './rollbar'

export default async (feedurl: string): Promise<string> => {
    const content = await fetch(feedurl, {
        headers: { 'user-agent': 'feedbox.h11.io' },
    })
        .then(res => res.buffer())
        .then(buf => {
            const encoding = chardet.detect(buf).encoding
            if (encoding === 'utf8') {
                return buf.toString()
            } else {
                return iconv.decode(buf, encoding)
            }
        })
        .catch(err => {
            console.error(err, feedurl)
            // rollbar.info(err, { feedurl })
            return ''
        })
    return content
}
