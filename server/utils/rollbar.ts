import Rollbar from 'rollbar'

export const rollbar = new Rollbar({
    accessToken: process.env.ROLLBAR_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true,
})

rollbar.configure({
    verbose: true,
    enabled: process.env.NODE_ENV === 'production',
})
