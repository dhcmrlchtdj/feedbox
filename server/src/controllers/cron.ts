import Feed from "../models/feed";
import fetch from "node-fetch";
import parseFeed, { FeedItem } from "../utils/parse-feed";
import sendEmail from "../utils/send-email";

type Tfeeds = {
    feed: Feed;
    prev: FeedItem[];
    curr: FeedItem[];
    currText: string;
};
type Tentries = {
    feed: Feed;
    entries: Array<{
        title: string;
        content: string;
    }>;
};
type Tmail = {
    addr: string;
    subject: string;
    text: string;
};

const feed2feeds = async (feed: Feed): Promise<Tfeeds | null> => {
    const url = feed.url;
    console.debug(`${url} - fetching`);
    const curr = await fetch(url)
        .then(res => res.text())
        .catch(err => {
            console.error(err);
            return null;
        });

    console.debug(`${url} - fetched`);
    if (!curr) return null;
    if (curr === feed.content) {
        console.debug(`${url} - no change`);
        return null;
    }

    const currFeed = await parseFeed(url, curr);
    if (currFeed.length === 0) {
        console.debug(`${url} - no content`);
        return null;
    }

    console.debug(`${url} - processing`);

    let prevFeed: FeedItem[] = [];
    if (feed.content) prevFeed = await parseFeed(url, feed.content);
    return {
        feed,
        prev: prevFeed,
        curr: currFeed,
        currText: curr,
    };
};

const feeds2entries = async (feeds: Tfeeds): Promise<Tentries | null> => {
    const prevId = feeds.prev.map(m => [m.guid, m.date] as [string, Date]);
    const prevMap = new Map(prevId);
    const entries = feeds.curr
        .filter(m => {
            const date = prevMap.get(m.guid);
            if (!date) return true;
            if (!m.date) return false;
            if (date.getTime() !== m.date.getTime()) return true;
            return false;
        })
        .map(m => {
            const title = m.title || "unknown";
            const author = m.author || m.meta.author || "unknown";
            const link = m.origlink || m.link || m.meta.link || feeds.feed.url;
            const article = m.description || m.summary || "unknown";
            return {
                title: `"${title}" by "${author}" on "${feeds.feed.url}"`,
                content: `${link}<br><br><br>${article}`,
            };
        });
    if (entries.length === 0) return null;
    return { feed: feeds.feed, entries };
};

const entries2mails = async (entries: Tentries): Promise<Tmail[]> => {
    const users = entries.feed.users;
    const mails = entries.entries.map(entry => {
        const ms = users.map(user => ({
            addr: user.email,
            subject: entry.title,
            text: entry.content,
        }));
        return ms;
    });
    const flatten = ([] as Tmail[]).concat(...mails);
    return flatten;
};

export const cron = {
    auth: "cron",
    async handler(_request, _h) {
        const feeds = await Feed.takeAll();
        feeds.forEach(async feed => {
            // fetch feed
            const f = await feed2feeds(feed);

            // save state
            feed.lastCheck = new Date();
            if (f) {
                // invalid byte sequence for encoding "UTF8": 0x00
                feed.content = f.currText.replace(/\0/g, "");
                feed.lastUpdated = f.curr[0].date || new Date();
            }
            await feed.save();

            // no content
            if (!f) return;
            // first time
            if (f.prev.length === 0) return;

            // extract entry
            const e = await feeds2entries(f);
            if (!e) return;

            // send email
            const m = await entries2mails(e);
            const s = m.map(m => sendEmail(m.addr, m.subject, m.text));
            await Promise.all(s);
        });
        return "ok";
    },
};
