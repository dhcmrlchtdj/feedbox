import { getConnection, getRepository } from 'typeorm';
import { User } from '../../model/user';
import { Feed } from '../../model/feed';
import * as FeedDB from './feed';

const cacheOpt = (id: number) => ({
    id: `user--${id}`,
    milliseconds: 5 * 60 * 1000,
});

const clearUserCache = async (id: number) => {
    const conn = getConnection();
    const cache = conn.queryResultCache;
    if (!cache) return;
    await cache.remove([`user--${id}`]);
};

export const getById = async (id: number): Promise<User | undefined> => {
    const userRepo = getRepository(User);
    const user = await userRepo.findOneById(id, { cache: cacheOpt(id) });
    return user;
};

export const getByEmail = async (email: string): Promise<User> => {
    const userRepo = getRepository(User);
    let user = await userRepo.findOne({ where: { email } });
    if (!user) {
        user = new User();
        user.email = email;
        await user.save();
    }
    return user;
};

export const getAllFeed = async (id: number): Promise<Feed[]> => {
    const userRepo = getRepository(User);
    const user = await userRepo.findOneById(id, { cache: cacheOpt(id) });
    if (user) {
        return user.feeds;
    } else {
        return [];
    }
};

export const removeFeed = async (id: number, feedId: number) => {
    const userRepo = getRepository(User);
    const user = await userRepo.findOneById(id, { cache: cacheOpt(id) });
    if (!user) return;

    user.feeds = user.feeds.filter(feed => feed.id !== feedId);
    await user.save();
    await clearUserCache(id);
};

export const removeFeedBatch = async (id: number, feedIds: number[]) => {
    const userRepo = getRepository(User);
    const user = await userRepo.findOneById(id, { cache: cacheOpt(id) });
    if (!user) return;

    user.feeds = user.feeds.filter(feed => !feedIds.includes(feed.id));
    await user.save();
    await clearUserCache(id);
};

export const addFeed = async (id: number, feedUrl: string) => {
    const userRepo = getRepository(User);
    const user = await userRepo.findOneById(id, { cache: cacheOpt(id) });
    if (!user) return;

    const feed = await FeedDB.getByUrl(feedUrl);
    user.feeds.push(feed);
    await user.save();
    await clearUserCache(id);
};

export const addFeedBatch = async (id: number, feedUrls: string[]) => {
    const userRepo = getRepository(User);
    const user = await userRepo.findOneById(id, { cache: cacheOpt(id) });
    if (!user) return;

    const feedsP = feedUrls.map(url => FeedDB.getByUrl(url));
    const feeds = await Promise.all(feedsP);
    user.feeds = user.feeds.concat(feeds);
    await user.save();
    await clearUserCache(id);
};
