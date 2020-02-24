import * as pino from 'hapi-pino'

export const logger = {
    plugin: pino,
    options: {
        logPayload: true,
        logRouteTags: true,
        // logRequestStart: true,
        // level: 'trace',
        prettyPrint: process.env.NODE_ENV !== 'production',
    },
}
