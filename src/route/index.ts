import worker from '../lib/worker';

const route = [
    {
        path: '/favicon.ico',
        method: 'get',
        options: {
            cache: {
                expiresIn: 24 * 60 * 60 * 1000,
            },
        },
        async handler(req, h) {
            return h
                .response()
                .code(204)
                .type('image/x-icon');
        },
    },

    {
        path: '/',
        method: 'get',
        async handler(req, h) {
            return 'ok';
        },
    },

    {
        path: '/wakeup',
        method: 'get',
        options: {
            auth: 'wakeupAuth',
        },
        async handler(req, h) {
            worker();
            return h.response().code(204);
        },
    },

    {
        path: '/add',
        method: 'put',
        async handler(req, h) {
            return 'ok';
        },
    },
    {
        path: '/remove',
        method: 'delete',
        async handler(req, h) {
            return 'ok';
        },
    },
    {
        path: '/import',
        method: 'post',
        async handler(req, h) {
            return 'ok';
        },
    },
    {
        path: '/export',
        method: 'get',
        async handler(req, h) {
            return 'ok';
        },
    },
];

export default route;
