import * as STREAM from 'stream';
import * as FeedParser from 'feedparser';
import axios from 'axios';

import { Tfeed, Tarticle } from './types';

const emptyFeed = (): Tfeed => {
    return {
        title: '',
        link: '',
        date: new Date(),
        articles: [],
    };
};

const agent = axios.create({
    timeout: 10 * 1000,
    responseType: 'stream',
    headers: {
        'User-Agen': 'feedbox/WIP',
    },
    validateStatus(status) {
        return status === 200;
    },
});

const parseFeed = async (url: string): Promise<Tfeed> => {
    const resp = await agent.get(url);
    const data = resp.data as STREAM.Readable;

    const parser = new FeedParser({ feedurl: url });
    data.pipe(parser);

    const p: Promise<Tfeed> = new Promise((resolve, reject) => {
        const feed = emptyFeed();

        parser.on('error', err => reject(err));

        parser.on('readable', () => {
            let item;
            while ((item = parser.read())) {
                feed.articles.push({
                    guid: item.guid,
                    title: item.title,
                    description: item.description,
                    link: item.link,
                    date: item.date,
                });
            }
        });

        parser.on('end', () => {
            const meta = parser.meta;
            feed.title = meta.title;
            feed.link = meta.link;
            feed.date = meta.date;

            resolve(feed);
        });
    });

    return p;
};

export default parseFeed;
