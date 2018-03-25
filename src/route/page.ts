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
];
export default route;
