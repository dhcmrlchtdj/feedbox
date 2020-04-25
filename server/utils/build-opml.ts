import { extractSite } from './extract-site'
import { encodeHtmlEntities } from '../../util/html-entity'

// http://dev.opml.org/spec2.html
export const buildOpml = (feeds: { url: string }[]): string => {
    const outlines = feeds
        .map((feed) => {
            const text = encodeHtmlEntities(extractSite(feed.url))
            const xmlUrl = encodeHtmlEntities(feed.url)
            return `<outline type="rss" text="${text}" xmlUrl="${xmlUrl}"/>`
        })
        .sort()
        .join('\n')

    const opml = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<opml version="1.0">',
        '<head><title>feeds</title></head>',
        '<body>',
        outlines,
        '</body>',
        '</opml>',
    ].join('\n')
    return opml
}
