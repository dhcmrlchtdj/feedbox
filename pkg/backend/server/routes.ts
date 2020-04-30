import * as Feed from './controllers/feed'
import * as User from './controllers/user'
import * as Helper from './controllers/helper'
import { staticFiles } from './controllers/static'
import * as TG from './controllers/telegram'

export const routes = [
    { path: '/api/v1/feeds', method: 'get', options: Feed.list },
    { path: '/api/v1/feeds/add', method: 'put', options: Feed.add },
    { path: '/api/v1/feeds/remove', method: 'delete', options: Feed.remove },
    { path: '/api/v1/feeds/export', method: 'get', options: Feed.exportFeeds },
    { path: '/api/v1/feeds/import', method: 'post', options: Feed.importFeeds },

    { path: '/api/v1/user', method: 'get', options: User.info },
    { path: '/api/logout', method: 'get', options: User.logout },
    { path: '/api/connect/github', method: 'get', options: User.connectGithub },

    {
        path: `/webhook/telegram/${process.env.TELEGRAM_WEBHOOK_PATH}`,
        method: 'post',
        options: TG.webhook,
    },

    process.env.NODE_ENV !== 'production' && {
        path: '/api/v1/helper/feed-preview',
        method: 'get',
        options: Helper.feedPreview,
    },

    ...staticFiles,
].filter(Boolean)
