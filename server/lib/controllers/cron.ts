import updateFeeds from '../utils/update-feeds'

export const cron = {
    auth: 'cron',
    async handler(_request, _h) {
        await updateFeeds()
        return 'ok'
    },
}
