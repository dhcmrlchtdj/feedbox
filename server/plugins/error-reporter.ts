import { rollbar as reporter } from '../utils/rollbar'

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
                        reporter.error(error, request)
                    } else if (resp.output.statusCode >= 400) {
                        reporter.info(error, request)
                    } else {
                        reporter.debug(error, request)
                    }
                }
                return h.continue
            }
            server.ext('onPreResponse', preResponse)
            // server.expose('reporter', rollbar)
        },
    },
}
