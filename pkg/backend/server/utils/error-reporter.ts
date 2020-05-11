import Rollbar from 'rollbar'

export const rollbar = new Rollbar({
    accessToken: process.env.ROLLBAR_TOKEN!,
    enabled: process.env.NODE_ENV === 'production',
    captureUncaught: true,
    captureUnhandledRejections: true,
    reportLevel: 'debug',
})

// https://github.com/getsentry/sentry-javascript/issues/1781#issuecomment-444510327
export const report = {
    err: (err: Error, tags: Record<string, string> = {}) => {
        rollbar.error(err, tags)
    },
    log: (msg: string, tags: Record<string, string> = {}) => {
        rollbar.log(msg, tags)
    },
}
