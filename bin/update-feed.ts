import { prepare } from '../server/prepare'
import { updateFeeds } from '../server/utils/update-feeds'
import { model } from '../server/models'

const main = async () => {
    await prepare()
    await updateFeeds()
    await model.destroy()
}

main()
