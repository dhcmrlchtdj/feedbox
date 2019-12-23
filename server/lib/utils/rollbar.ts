import * as Rollbar from 'rollbar'

const rollbar = new Rollbar({
    accessToken: process.env.ROLLBAR_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true,
})

rollbar.configure({
    verbose: true,
    enabled: process.env.NODE_ENV === 'production',
})

export default rollbar
