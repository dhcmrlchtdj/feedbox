import fetchFeed from './fetch-feed';
import send from './send';

import { getAllFeeds } from './db/feed';
import { amap, afilter } from './util';

export default async () => {
    const f0 = await getAllFeeds();
    const f1 = await amap(f0, async feed => {
        const url = feed.link;
        const newFeed = await fetchFeed(url);
        return { feed, newFeed };
    });

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
        return { feed, newArticles };
    });

    await amap(f3, async ({ feed, newArticles }) => {
        newArticles.map(article => {
            feed.articles[article.guid] = article;
        });
        await feed.save();
    });

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
