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
        options: {
            auth: {
                strategy: 'apiAuth',
                mode: 'try',
            },
        },
        async handler(req, h) {
            if (req.auth.isAuthenticated) {
                return h
                    .response()
                    .redirect('/dashboard')
                    .temporary();
            }
            return 'ok';
        },
    },

    {
        path: '/dashboard',
        method: 'get',
        options: { auth: 'apiAuth' },
        async handler(req, h) {
            return 'dashboard';
        },
    },
];
export default route;
