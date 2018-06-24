import { createConnection } from 'typeorm';
import { User } from './entity/user';
import { Feed } from './entity/feed';

export const init = async () => {
    await createConnection({
        synchronize: process.env.NODE_ENV !== 'production',
        logging: true,
        cache: true,
        entities: [User, Feed],
        type: process.env.DATABASE_TYPE as any,
        database: process.env.DATABASE_DATABASE,
        url: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production',
    });
};
