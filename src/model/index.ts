import { createConnection } from 'typeorm';
import { User } from './user';
import { Feed } from './feed';

export default async () => {
    await createConnection({
        synchronize: process.env.NODE_ENV !== 'production',
        logging: true,
        cache: true,
        entities: [User, Feed],
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production',
    });
};
