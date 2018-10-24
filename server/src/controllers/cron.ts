import Feed from "../models/feed";

import fetch from "node-fetch";
const getFeed = async (feed: Feed): Promise<string> => {
    const url = feed.url;
    const content = await fetch(url).then(res => res.text());
    return content;
};

export const cron = {
    auth: "cron",
    async handler(_request, h) {
        const feeds = await Feed.takeAll();
        feeds.map(getFeed);
        return h.response(feeds);
    },
};
