import { rollbar as r } from '../utils/rollbar'

const rollbarPlugin = {
    name: 'rollbar',
    register: async (server, _options) => {
        const preResponse = (request, h) => {
            const resp = request.response
            if (resp.isBoom) {
                const error = resp instanceof Error ? resp : `Error: ${resp}`
                if (resp.output.statusCode >= 500) {
                    r.error(error, request)
                }
            }
            return h.continue
        }

        server.ext('onPreResponse', preResponse)
        server.expose('rollbar', rollbar)
    },
}

export const rollbar = {
    plugin: rollbarPlugin,
    options: {},
}
