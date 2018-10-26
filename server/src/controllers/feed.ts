import * as Joi from "joi";
import Feed from "../models/feed";

export const list = {
    async handler(request, _h) {
        const { userId } = request.auth.credentials;
        const feeds = await Feed.takeByUser(userId);
        return feeds;
    },
};

export const add = {
    validate: {
        payload: {
            url: Joi.string().uri(),
        },
    },
    async handler(request, _h) {
        const { url } = request.payload;
        const feed = await Feed.takeOrCreate(url);
        const { userId } = request.auth.credentials;
        await Feed.addUser(feed.id, userId);

        const feeds = await Feed.takeByUser(userId);
        return feeds;
    },
};

export const remove = {
    validate: {
        payload: {
            feedId: Joi.string(),
        },
    },
    async handler(request, h) {
        const { feedId } = request.payload;
        const { userId } = request.auth.credentials;
        await Feed.removeUser(feedId, userId);

        const feeds = await Feed.takeByUser(userId);
        return h.response(feeds);
    },
};

export const importFeeds = {
    async handler(_request, h) {
        return h.response().code(501);
    },
};

export const exportFeeds = {
    async handler(_request, h) {
        return h.response().code(501);
    },
};
