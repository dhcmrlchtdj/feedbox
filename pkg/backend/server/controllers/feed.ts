import * as Joi from 'joi'
import { model } from '../models'
import { buildOpml } from '../utils/build-opml'
import { extractLinks } from '../utils/extract-link-from-opml'

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
        await model.subscribe(userId, feedId)
        return model.getFeedByUser(userId)
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
    async handler(request, h) {
        const { userId } = request.auth.credentials
        const feeds = await model.getFeedByUser(userId)
        const opml = buildOpml(feeds)
        return h.response(opml).type('application/xml')
    },
}
