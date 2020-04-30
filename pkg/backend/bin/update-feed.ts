import '../server/init-env'
import { updateFeeds } from '../server/utils/update-feeds'
import { model } from '../server/models'

const main = async () => {
    await updateFeeds()
    await model.destroy()
}

main()
