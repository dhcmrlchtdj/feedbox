import prepare from '../lib/prepare'
import { updateFeeds } from '../lib/utils/update-feeds'
import { model } from '../lib/models'

const main = async () => {
    await prepare()
    await updateFeeds()
    await model.destroy()
}

main()
