import init from '../lib/init'
import updateFeeds from '../lib/utils/update-feeds'

const main = async () => {
    await init()
    await updateFeeds()
}

main()
