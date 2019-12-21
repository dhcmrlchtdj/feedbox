import * as Joi from '@hapi/joi'
import Feed from '../models/feed'
import extractSite from '../utils/extract-site'

export const list = {
    async handler(request, _h) {
        const { userId } = request.auth.credentials
        const feeds = await Feed.takeByUser(userId)
        return feeds
    },
}

export const add = {
    validate: {
        payload: Joi.object({
            url: Joi.string().uri().required(),
        }),
    },
    async handler(request, _h) {
        const { url } = request.payload
        const feed = await Feed.takeOrCreate(url)
        const { userId } = request.auth.credentials
        await Feed.addUser(feed.id, userId)

        const feeds = await Feed.takeByUser(userId)
        return feeds
    },
}

export const remove = {
    validate: {
        payload: Joi.object({
            feedId: Joi.number().required(),
        }),
    },
    async handler(request, _h) {
        const { feedId } = request.payload
        const { userId } = request.auth.credentials
        await Feed.removeUser(feedId, userId)

        const feeds = await Feed.takeByUser(userId)
        return feeds
    },
}

export const importFeeds = {
    async handler(_request, h) {
        return h.response().code(501)
    },
}

export const exportFeeds = {
    // spec
    // http://dev.opml.org/spec2.html
    async handler(request, h) {
        const { userId } = request.auth.credentials
        const feeds = await Feed.takeByUser(userId)
        const outlines = feeds
            .map(feed => {
                const text = extractSite(feed.url)
                const xmlUrl = feed.url
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
        return h.response(opml).type('text/x-opml')
    },
}
