import { getUserById } from '../lib/db/user';

const route = [
    {
        path: '/api/user/feeds',
        method: 'get',
        options: { auth: 'apiAuth' },
        async handler(req, h) {},
    },
    {
        path: '/api/user/feed/add',
        method: 'put',
        options: { auth: 'apiAuth' },
        async handler(req, h) {
            return 'ok';
        },
    },
    {
        path: '/api/user/feed/remove',
        method: 'delete',
        options: { auth: 'apiAuth' },
        async handler(req, h) {
            return 'ok';
        },
    },
    {
        path: '/api/user/feed/import',
        method: 'post',
        options: { auth: 'apiAuth' },
        async handler(req, h) {
            return 'ok';
        },
    },
    {
        path: '/api/user/feed/export',
        method: 'get',
        options: { auth: 'apiAuth' },
        async handler(req, h) {
            return 'ok';
        },
    },
];

export default route;
