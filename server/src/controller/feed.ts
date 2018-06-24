import * as Joi from 'joi';
// import * as UserDB from '../../../lib/db/user';

export const getAll = {
    auth: 'apiAuth',
    handler: async (req, _h) => {
        const { id } = req.auth.credentials;
        return id;
        // const feeds = await UserDB.getAllFeed(id);
        // return { feeds };
    },
};
export const add = {
    auth: 'apiAuth',
    validate: {
        payload: Joi.object({
            feed: Joi.string()
                .uri()
                .required(),
        }),
    },
    handler: async (req, _h) => {
        const { id } = req.auth.credentials;
        const { feed } = req.payload;
        return { id, feed };
        // const f = await UserDB.addFeed(id, feed);
        // return { feed: f };
    },
};
export const remove = {
    auth: 'apiAuth',
    handler: async (_req, _h) => {
        return 'ok';
    },
};
export const importFeeds = {
    auth: 'apiAuth',
    handler: async (_req, _h) => {
        return 'ok';
    },
};
export const exportFeeds = {
    options: { auth: 'apiAuth' },
    handler: async (_req, _h) => {
        return 'ok';
    },
};
