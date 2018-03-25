import { getRepository } from 'typeorm';
import { Feed } from '../../model/feed';

export const getAllFeeds = async (): Promise<Feed[]> => {
    const feedRepo = getRepository(Feed);
    const feeds = await feedRepo.find();
    return feeds;
};
