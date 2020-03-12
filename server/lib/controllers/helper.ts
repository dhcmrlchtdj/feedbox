import * as Joi from '@hapi/joi'
import { parseFeed } from '../utils/parse-feed'
import { fetchFeedWithRetry } from '../utils/fetch-feed'

export const feedPreview = {
    validate: {
        query: Joi.object({
            url: Joi.string()
                .uri()
                .required(),
        }),
    },
    async handler(request, _h) {
        const { url } = request.query
        const content = await fetchFeedWithRetry(url, 2)
        if (content.isSome) {
            const feed = await parseFeed(url, content.getExn())
            return feed
        } else {
            return 'fetch error'
        }
    },
}
