import * as UserDB from '../../lib/db/user';

const route = [
    {
        path: '/v1/user/info',
        method: 'get',
        options: { auth: 'apiAuth' },
        async handler(req, h) {
            const user = req.auth.credentials;
            return {
                email: user.email,
            };
        },
    },
    {
        path: '/v1/user/feeds',
        method: 'get',
        options: { auth: 'apiAuth' },
        async handler(req, h) {
            const user = req.auth.credentials;
            const id = user.id;
            const feeds = await UserDB.getAllFeed(id);
            return { feeds };
        },
    },
    {
        path: '/v1/user/feed/add',
        method: 'put',
        options: { auth: 'apiAuth' },
        async handler(req, h) {
            return 'ok';
        },
    },
    {
        path: '/v1/user/feed/remove',
        method: 'delete',
        options: { auth: 'apiAuth' },
        async handler(req, h) {
            return 'ok';
        },
    },
    {
        path: '/v1/user/feed/import',
        method: 'post',
        options: { auth: 'apiAuth' },
        async handler(req, h) {
            return 'ok';
        },
    },
    {
        path: '/v1/user/feed/export',
        method: 'get',
        options: { auth: 'apiAuth' },
        async handler(req, h) {
            return 'ok';
        },
    },
];

export default route;
