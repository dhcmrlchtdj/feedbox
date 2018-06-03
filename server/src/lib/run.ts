import fetchFeed from './fetch-feed';
import send from './send';

import * as FeedDB from './db/feed';
import { amap } from './util';

export default async () => {
    // fetch feeds
    const f0 = await FeedDB.getAll();
    const f1 = await amap(f0, async feed => {
        const url = feed.link;
        const newFeed = await fetchFeed(url);
        return { feed, newFeed };
    });

    // filter new articles
    const f2 = f1.filter(({ feed, newFeed }) => newFeed.date > feed.date);
    const f3 = f2.map(({ feed, newFeed }) => {
        const prevArticles = feed.articles;
        const currArticles = newFeed.articles;
        const newArticles = Object.values(currArticles).filter(curr => {
            const prev = prevArticles[curr.guid];
            if (!prev) return true;
            if (curr.date > prev.date) return true;
            return false;
        });
        return { feed, newFeed, newArticles };
    });

    // update database
    await amap(f3, async ({ feed, newFeed, newArticles }) => {
        feed.link = newFeed.link;
        feed.title = newFeed.title;
        feed.date = newFeed.date;
        newArticles.map(article => {
            feed.articles[article.guid] = article;
        });
        await feed.save();
    });

    // send email
    await amap(f3, async ({ feed, newArticles }) => {
        const contents = newArticles.map(article => {
            const text = article.description;
            const subject = `${article.title} - ${feed.title}`;
            return { subject, text };
        });
        const receivers = feed.users.map(user => user.email);
        await amap(receivers, receiver => {
            const tasks = contents.map(({ subject, text }) =>
                send(receiver, subject, text),
            );
            return Promise.all(tasks);
        });
    });
};
