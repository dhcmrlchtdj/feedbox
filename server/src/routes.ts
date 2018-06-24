import {RequestRoute} from 'hapi';
import * as Wakeup from './controller/wakeup';
import * as User from './controller/user';
import * as Feed from './controller/feed';

const routes:RequestRoute[] = [
    { method: 'get', path: '/wakeup', options: Wakeup.wakeup },

    { method: 'get', path: '/api/v1/user', options: User.user },
    { method: 'post', path: '/api/v1/login', options: User.login },
    { method: 'get', path: '/api/v1/logout', options: User.logout },

    { method: 'get', path: '/api/v1/feeds', options: Feed.getAll },
    { method: 'put', path: '/api/v1/feed/add', options: Feed.add },
    { method: 'delete', path: '/api/v1/feed/remove', options: Feed.remove },
    { method: 'post', path: '/api/v1/feed/import', options: Feed.importFeeds },
    { method: 'get', path: '/api/v1/feed/export', options: Feed.exportFeeds },
];

export default routes;
