import Feed from "../models/feed";

import fetch from "node-fetch";

const f = async (feed: Feed) => {
    const url = feed.url;
    const curr = await fetch(url).then(res => res.text());
    const prev = feed.content;
    if (curr === prev) return;
    const articles = [];
    return articles;
};

export const cron = {
    auth: "cron",
    async handler(_request, h) {
        const feeds = await Feed.takeAll();
        feeds.map(f);
        return h.response(feeds);
    },
};
