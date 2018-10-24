import Feed from "../models/feed";

export const cron = {
    auth: "cron",
    async handler(_request, h) {
        const feeds = await Feed.takeAll();
        return h.response(feeds);
    },
};
