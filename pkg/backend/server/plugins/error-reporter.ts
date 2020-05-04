import { rollbar } from '../utils/error-reporter'

export const errorReporter = {
    options: {},
    plugin: {
        name: 'errorReporter',
        register: async (server, _options) => {
            const preResponse = (request, h) => {
                const resp = request.response
                if (resp.isBoom) {
                    const error =
                        resp instanceof Error ? resp : `Error: ${resp}`
                    if (resp.output.statusCode >= 500) {
                        rollbar.error(error, request)
                    } else if (resp.output.statusCode >= 400) {
                        rollbar.info(error, request)
                    } else {
                        rollbar.debug(error, request)
                    }
                }
                return h.continue
            }
            server.ext('onPreResponse', preResponse)
            // server.expose('reporter', rollbar)
        },
    },
}
