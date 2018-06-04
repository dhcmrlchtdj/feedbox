const route = [
    {
        path: '/wakeup',
        method: 'get',
        options: { auth: 'wakeupAuth' },
        handler: async (_req, h) => h.response('ok'),
    },
];

export default route;
