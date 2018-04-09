import { getRepository } from 'typeorm';
import { Feed } from '../../model/feed';

import fetchFeed from '../fetch-feed';

export const getAll = async (): Promise<Feed[]> => {
    const feedRepo = getRepository(Feed);
    const feeds = await feedRepo.find();
    return feeds;
};

export const getByUrl = async (url: string): Promise<Feed> => {
    const feedRepo = getRepository(Feed);
    let feed = await feedRepo.findOne({ where: { link: url } });
    if (!feed) {
        const f = await fetchFeed(url);
        feed = new Feed();
        feed.link = f.link || url;
        feed.website = f.website;
        feed.title = f.title;
        feed.date = f.date;
        feed.articles = f.articles;
        await feed.save();
    }
    return feed;
};
