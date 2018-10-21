import * as Joi from "joi";
import User from "../models/user";
import Feed from "../models/feed";

export const list = {
    async handler(request, h) {
        const { userId } = request.auth.credentials;
        const user = await User.takeOne({
            where: { id: userId },
            relations: ["feeds"],
        });
        if (!user) throw new Error("invalid user id");

        return h.response(user.feeds);
    },
};

export const add = {
    validate: {
        payload: {
            url: Joi.string().uri(),
        },
    },
    async handler(request, h) {
        const { userId } = request.auth.credentials;
        const user = await User.takeOne({
            where: { id: userId },
            relations: ["feeds"],
        });
        if (!user) throw new Error("invalid user id");

        const { url } = request.payload;
        const idx = user.feeds.findIndex(feed => feed.url === url);
        if (idx !== -1) return h.response().code(400);

        const feed = await Feed.takeOrCreate(url);
        user.feeds.push(feed);
        await user.save();

        return h.response(feed);
    },
};

export const remove = {
    validate: {
        payload: {
            url: Joi.string().uri(),
        },
    },
    async handler(request, h) {
        const { userId } = request.auth.credentials;
        const user = await User.takeOne({
            where: { id: userId },
            relations: ["feeds"],
        });
        if (!user) throw new Error("invalid user id");

        const { url } = request.payload;
        const idx = user.feeds.findIndex(feed => feed.url === url);
        if (idx === -1) return h.response().code(400);

        const feed = user.feeds.splice(idx, 1);
        await user.save();

        return h.response(feed);
    },
};

export const importFeeds = {
    async handler(request, h) {
        return { name: "x" };
    },
};

export const exportFeeds = {
    async handler(request, h) {
        return { name: "x" };
    },
};
