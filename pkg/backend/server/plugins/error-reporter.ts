import hapiSentry from 'hapi-sentry'
import { Sentry } from '../utils/error-reporter'

export const errorReporter = {
    plugin: hapiSentry,
    options: {
        client: Sentry,
    },
}
