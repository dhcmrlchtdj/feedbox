import Feed from "../models/feed";
import fetch from "node-fetch";
import parseFeed from "../utils/parse-feed";

const f = async (feed: Feed) => {
    const url = feed.url;
    const curr = await fetch(url).then(res => res.text());
    const f = await parseFeed(url, curr);
    console.log(f);
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
