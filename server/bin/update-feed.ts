import prepare from '../lib/prepare'
import updateFeeds from '../lib/utils/update-feeds'
import Model from '../lib/models'

const main = async () => {
    await prepare()
    await updateFeeds()
    await Model.destroy()
}

main()
