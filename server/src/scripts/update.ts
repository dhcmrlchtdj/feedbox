import prepare from '../prepare'
import updateFeeds from '../utils/update-feeds'

const main = async () => {
    await prepare()
    await updateFeeds()
}

main()
