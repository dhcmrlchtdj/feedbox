import * as STREAM from 'stream';
import axios from 'axios';
import * as FeedParser from 'feedparser';

type Tarticle = {
    title: string;
    summary: string;
    description: string;
    link: string;
    guid: string;
    pubdate: Date;
    date: Date;
};

type Tfeed = {
    title: string;
    description: string;
    link: string;
    pubdate: Date;
    date: Date;
    articles: Tarticle[];
};

const emptyFeed = (): Tfeed => {
    return {
        title: '',
        description: '',
        link: '',
        pubdate: new Date(),
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
                    title: item.title,
                    description: item.description,
                    summary: item.summary,
                    link: item.link,
                    guid: item.guid,
                    pubdate: item.pubdate,
                    date: item.date,
                });
            }
        });

        parser.on('end', () => {
            const meta = parser.meta;
            feed.title = meta.title;
            feed.description = meta.description;
            feed.link = meta.link;
            feed.pubdate = meta.pubdate;
            feed.date = meta.date;

            resolve(feed);
        });
    });

    return p;
};

export default parseFeed;
