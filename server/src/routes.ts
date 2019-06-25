import * as Feed from './controllers/feed'
import * as User from './controllers/user'
import * as Cron from './controllers/cron'
import * as Helper from './controllers/helper'

const icon = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABmklEQVR4AcWWgUeDQRjGD6iogFgCooCiP6ZWf0QIomq7NygmAFWr/pigJSEChNik7q5Ai7bwdK/vSF8tt6/b3cOP+Yz3vXvvnnuEr/BC4zDVFWh5Ak1XFm3pOjR/g6I6DC3DrI+JUIKhWVv0zPJmgR/8XzqF3p4pXri1NgJF+9Dyw4JiUBeGarinYdGPuHNoeWtBIBowm5OexSsL2UwlAtOConmPlYcunmtCU0n8Jp4TNN0MsLiDrvl8ibzcgUMUlNz5edXcaY/E67dRuHuOqBg6+HI4ZzJxoTbYMZ29Ig3VsmBvT9aAkscie1gkEtHgHTAJG1ACSnbSNUDv6RtIPoL0h1BRPd01pCPBGS6hES3yCEYt7RRWzLUFiwNkgu2v55NQN6IFd6BoOp8JahF3YK9HJJONCLO/wN3qUI9QSiVLc4ANPOB5a0r8JY7OnF7DF6cmnipzwkd43JiAludBt91lQG/xnDi9/scjsoeOdt3Mi4k75wDZXyPU5rTjrloQOcesltm/YeiSXzJeIcO/+RuMPISmJedwXvoEIKUq7CctWTEAAAAASUVORK5CYII',
    'base64',
)

const routes = [
    { path: '/api/v1/feeds', method: 'get', options: Feed.list },
    { path: '/api/v1/feeds/add', method: 'put', options: Feed.add },
    { path: '/api/v1/feeds/remove', method: 'delete', options: Feed.remove },
    { path: '/api/v1/feeds/export', method: 'get', options: Feed.exportFeeds },
    { path: '/api/v1/feeds/import', method: 'post', options: Feed.importFeeds },

    { path: '/api/v1/user', method: 'get', options: User.info },
    { path: '/api/logout', method: 'get', options: User.logout },
    { path: '/api/connect/github', method: 'get', options: User.connectGithub },

    { path: '/api/v1/cron', method: 'get', options: Cron.cron },
    {
        path: '/api/v1/helper/feed-preview',
        method: 'get',
        options: Helper.feedPreview,
    },

    {
        path: '/favicon.ico',
        method: 'get',
        options: { auth: false },
        async handler(_request, h) {
            return h.response(icon).type('image/png')
        },
    },
]

export default routes
