const route = [
    {
        method: 'GET',
        path: '/',
        handler: async function(request, h) {
            return 'hello world';
        },
    },
];

export default route;
