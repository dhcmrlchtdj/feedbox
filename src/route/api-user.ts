const route = [
    {
        path: '/api/user/add',
        method: 'put',
        async handler(req, h) {
            return 'ok';
        },
    },
    {
        path: '/api/user/remove',
        method: 'delete',
        async handler(req, h) {
            return 'ok';
        },
    },
    {
        path: '/api/user/import',
        method: 'post',
        async handler(req, h) {
            return 'ok';
        },
    },
    {
        path: '/api/user/export',
        method: 'get',
        async handler(req, h) {
            return 'ok';
        },
    },
];

export default route;
