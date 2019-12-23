import prepare from '../lib/prepare'
import updateFeeds from '../lib/utils/update-feeds'

const main = async () => {
    await prepare()
    await updateFeeds()
}

main()
