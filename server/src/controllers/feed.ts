import * as Joi from "joi";
import Feed from "../models/feed";

export const list = {
    async handler(request, h) {
        const { userId } = request.auth.credentials;
        const feeds = await Feed.takeByUser(userId);
        return h.response(feeds);
    },
};

export const add = {
    validate: {
        payload: {
            url: Joi.string().uri(),
        },
    },
    async handler(request, h) {
        const { url } = request.payload;
        const feed = await Feed.takeOrCreate(url);

        const { userId } = request.auth.credentials;
        try {
            await Feed.createQueryBuilder("feed")
                .relation(Feed, "users")
                .of(feed)
                .add(userId);
        } catch (err) {
            if (!err.message.includes("UNIQUE")) throw err;
        }

        const feeds = await Feed.takeByUser(userId);
        return h.response(feeds);
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
        await Feed.createQueryBuilder("feed")
            .relation(Feed, "users")
            .of(feedId)
            .remove(userId);

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
