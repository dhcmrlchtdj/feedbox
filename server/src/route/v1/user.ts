import * as Joi from 'joi';
import * as UserDB from '../../lib/db/user';

const route = [
    {
        path: '/v1/user/info',
        method: 'get',
        options: { auth: 'apiAuth' },
        async handler(req, _h) {
            const { email } = req.auth.credentials;
            return { email };
        },
    },
    {
        path: '/v1/user/feeds',
        method: 'get',
        options: { auth: 'apiAuth' },
        async handler(req, _h) {
            const { id } = req.auth.credentials;
            const feeds = await UserDB.getAllFeed(id);
            return { feeds };
        },
    },
    {
        path: '/v1/user/feed/add',
        method: 'put',
        options: {
            auth: 'apiAuth',
            validate: {
                payload: Joi.object({
                    feed: Joi.string()
                        .uri()
                        .required(),
                }),
            },
        },
        async handler(req, _h) {
            const { id } = req.auth.credentials;
            const { feed } = req.payload;
            const f = await UserDB.addFeed(id, feed);
            return { feed: f };
        },
    },
    {
        path: '/v1/user/feed/remove',
        method: 'delete',
        options: { auth: 'apiAuth' },
        async handler(_req, _h) {
            return 'ok';
        },
    },
    {
        path: '/v1/user/feed/import',
        method: 'post',
        options: { auth: 'apiAuth' },
        async handler(_req, _h) {
            return 'ok';
        },
    },
    {
        path: '/v1/user/feed/export',
        method: 'get',
        options: { auth: 'apiAuth' },
        async handler(_req, _h) {
            return 'ok';
        },
    },
];

export default route;
