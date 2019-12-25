import { parse } from 'fast-xml-parser'
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
            url: Joi.string()
                .uri()
                .required(),
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
    payload: {
        allow: 'multipart/form-data',
        multipart: { output: 'annotated' },
    },
    validate: {
        payload: Joi.object({
            opml: Joi.required(),
        }),
    },
    async handler(request, _h) {
        const { userId } = request.auth.credentials

        const str = request.payload.opml.payload
        const xml = parse(str, { ignoreAttributes: false })
        const outline = xml?.opml?.body?.outline
        const links = new Set<string>()
        if (Array.isArray(outline)) {
            outline.forEach(o => links.add(o['@_xmlUrl']))
        } else if (outline != null) {
            links.add(outline['@_xmlUrl'])
        }
        // TODO bulk insert

        const feeds = await Feed.takeByUser(userId)
        return feeds
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
