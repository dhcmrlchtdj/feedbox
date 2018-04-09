import { getConnection, getRepository } from 'typeorm';
import { User } from '../../model/user';
import { Feed } from '../../model/feed';
import * as FeedDB from './feed';

export const getById = async (id: number): Promise<User | undefined> => {
    const userRepo = getRepository(User);
    const user = await userRepo.findOneById(id, { relations: ['feeds'] });
    return user;
};

export const getByEmail = async (email: string): Promise<User> => {
    const userRepo = getRepository(User);
    let user = await userRepo.findOne({
        where: { email },
        relations: ['feeds'],
    });
    if (!user) {
        user = new User();
        user.email = email;
        await user.save();
    }
    return user;
};

export const getAllFeed = async (id: number): Promise<Feed[]> => {
    const userRepo = getRepository(User);
    const user = await userRepo.findOneById(id, { relations: ['feeds'] });
    console.log(user);
    if (user) {
        return user.feeds;
    } else {
        return [];
    }
};

export const removeFeed = async (id: number, feedId: number): Promise<void> => {
    const userRepo = getRepository(User);
    const user = await userRepo.findOneById(id, { relations: ['feeds'] });
    if (!user) return;

    user.feeds = user.feeds.filter(feed => feed.id !== feedId);
    await user.save();
};

export const removeFeedBatch = async (
    id: number,
    feedIds: number[],
): Promise<void> => {
    const userRepo = getRepository(User);
    const user = await userRepo.findOneById(id, { relations: ['feeds'] });
    if (!user) return;

    user.feeds = user.feeds.filter(feed => !feedIds.includes(feed.id));
    await user.save();
};

export const addFeed = async (
    id: number,
    feedUrl: string,
): Promise<Feed | undefined> => {
    const userRepo = getRepository(User);
    const user = await userRepo.findOneById(id, { relations: ['feeds'] });
    if (!user) return;

    const feed = await FeedDB.getByUrl(feedUrl);
    user.feeds.push(feed);
    await user.save();
    return feed;
};

export const addFeedBatch = async (
    id: number,
    feedUrls: string[],
): Promise<Feed[] | undefined> => {
    const userRepo = getRepository(User);
    const user = await userRepo.findOneById(id, { relations: ['feeds'] });
    if (!user) return;

    const feedsP = feedUrls.map(url => FeedDB.getByUrl(url));
    const feeds = await Promise.all(feedsP);
    user.feeds = user.feeds.concat(feeds);
    await user.save();
    return feeds;
};
