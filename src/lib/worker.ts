import * as Stream from 'stream';
import axios from 'axios';
import * as FeedParser from 'feedparser';

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

const parseFeed = async (url: string) => {
    const resp = await agent.get(url);
    const data = resp.data as Stream.Readable;
    const parser = new FeedParser({ feedurl: url });
    data.pipe(parser);
    parser.on('error', err => {
        console.log(err);
    });

    const obj: any[] = [];

    parser.on('readable', () => {
        let item;
        while ((item = parser.read())) {
            const {
                title,
                description,
                summary,
                link,
                date,
                pubdate,
                guid,
                categories,
            } = item;
            obj.push({
                title,
                description,
                summary,
                link,
                date,
                pubdate,
                guid,
                categories,
            });
        }
    });

    parser.on('end', () => {
        const { title, description, link, xmlurl, date, pubdate } = parser.meta;
        console.log({
            title,
            description,
            link,
            xmlurl,
            date,
            pubdate,
        });
        console.log(obj);
    });
};
// parseFeed('https://blog.cloudflare.com/rss/');

export default async () => {};
