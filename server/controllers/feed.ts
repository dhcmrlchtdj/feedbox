import * as Joi from '@hapi/joi'
import * as Boom from '@hapi/boom'
import { model } from '../models'
import { extractSite } from '../utils/extract-site'
import { extractLinks } from '../utils/extract-link-from-opml'
import { encodeHtmlEntities } from '../../util/html-entity'

export const list = {
    async handler(request, _h) {
        const { userId } = request.auth.credentials
        return model.getFeedByUser(userId)
    },
}

export const add = {
    validate: {
        payload: Joi.object({
            url: Joi.string().uri().required(),
        }),
    },
    async handler(request, _h) {
        const { userId } = request.auth.credentials
        const feedId = await model.getFeedIdByUrl(request.payload.url)
        if (feedId === null) {
            throw Boom.serverUnavailable('unavailable | cannot add feed')
        } else {
            await model.subscribe(userId, feedId)
            return model.getFeedByUser(userId)
        }
    },
}

export const remove = {
    validate: {
        payload: Joi.object({
            feedId: Joi.number().required(),
        }),
    },
    async handler(request, _h) {
        const { userId } = request.auth.credentials
        const { feedId } = request.payload
        await model.unsubscribe(userId, feedId)
        return model.getFeedByUser(userId)
    },
}

export const importFeeds = {
    payload: {
        allow: 'multipart/form-data',
        multipart: { output: 'annotated' },
    },
    validate: {
        payload: Joi.object({
            opml: Joi.object({
                filename: Joi.string(),
                headers: Joi.object(),
                payload: Joi.string(),
            }).required(),
        }),
    },
    async handler(request, _h) {
        const { userId } = request.auth.credentials
        const str = request.payload.opml.payload
        const links = extractLinks(str)
        await model.subscribeUrls(userId, links)
        return model.getFeedByUser(userId)
    },
}

export const exportFeeds = {
    // spec
    // http://dev.opml.org/spec2.html
    async handler(request, h) {
        const { userId } = request.auth.credentials
        const feeds = await model.getFeedByUser(userId)
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
        return h.response(opml).type('application/xml')
    },
}
