import * as Joi from '@hapi/joi'
import Model from '../models'
import extractSite from '../utils/extract-site'
import extractLinks from '../utils/extract-link-from-opml'

export const list = {
    async handler(request, _h) {
        const { userId } = request.auth.credentials
        return Model.getFeedByUser(userId)
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
        const { userId } = request.auth.credentials
        const feedId = await Model.getFeedIdByUrl(request.payload.url)
        await Model.subscribe(userId, feedId)
        return Model.getFeedByUser(userId)
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
        await Model.unsubscribe(userId, feedId)
        return Model.getFeedByUser(userId)
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
        const str = request.payload.opml.payload.trim()
        const links = extractLinks(str)
        await Model.subscribeUrls(userId, links)
        return Model.getFeedByUser(userId)
    },
}

export const exportFeeds = {
    // spec
    // http://dev.opml.org/spec2.html
    async handler(request, h) {
        const { userId } = request.auth.credentials
        const feeds = await Model.getFeedByUser(userId)
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
