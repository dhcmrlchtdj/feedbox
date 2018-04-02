import * as PATH from 'path';

const route = [
    {
        path: '/',
        method: 'get',
        handler: {
            file: PATH.resolve(__dirname, '../../client/index.html'),
        },
    },

    {
        path: '/asset/{file*}',
        method: 'get',
        options: {
            cache: {
                expiresIn: 30 * 24 * 60 * 60 * 1000,
            },
        },
        handler: {
            directory: {
                path: PATH.resolve(__dirname, '../../client/'),
                index: false,
            },
        },
    },
];

export default route;
