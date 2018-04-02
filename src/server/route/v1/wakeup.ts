const route = [
    {
        path: '/v1/wakeup',
        method: 'get',
        options: {
            auth: 'wakeupAuth',
        },
        async handler(req, h) {
            return h.response().code(204);
        },
    },
];

export default route;
