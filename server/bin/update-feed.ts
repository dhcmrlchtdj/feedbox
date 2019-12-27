import prepare from '../lib/prepare'
import updateFeeds from '../lib/utils/update-feeds'
import dbConn from '../lib/models/conn'

const main = async () => {
    await prepare()
    await updateFeeds()
    await dbConn().destroy()
}

main()
