import * as Joi from '@hapi/joi'
import fetch from 'node-fetch'
import parseFeed from '../utils/parse-feed'

export const feedPreview = {
    validate: {
        query: {
            url: Joi.string()
                .uri()
                .required(),
        },
    },
    async handler(request, _h) {
        const { url } = request.query

        const curr = await fetch(url, {
            headers: { 'user-agent': 'feedbox.h11.io' },
        }).then(res => res.text())
        const feed = await parseFeed(url, curr)

        return feed
    },
}
