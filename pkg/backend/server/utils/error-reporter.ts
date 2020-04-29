import * as Sentry from '@sentry/node'

Sentry.init({
    dsn: process.env.SENTRY_DSN,
})

export { Sentry }

// https://github.com/getsentry/sentry-javascript/issues/1781#issuecomment-444510327
export const report = {
    err: (err: Error, tags: Record<string, string> = {}) => {
        Sentry.withScope((scope) => {
            scope.setTags(tags)
            Sentry.captureException(err)
        })
    },
    log: (msg: string, tags: Record<string, string> = {}) => {
        Sentry.withScope((scope) => {
            scope.setTags(tags)
            Sentry.captureMessage(msg)
        })
    },
}
