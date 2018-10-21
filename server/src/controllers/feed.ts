import User from "../models/user";
import Feed from "../models/feed";

export const list = {
    async handler(request, h) {
        const { user } = request.auth.credentials;
        const feeds = await Feed.find({relations:[]});
        return { name: "404" };
    },
};

export const add = {
    async handler(request, h) {
        return { name: "x" };
    },
};

export const remove = {
    async handler(request, h) {
        return { name: "x" };
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
