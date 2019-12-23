import rollbar from '../utils/rollbar'

const rollbarPlugin = {
    name: 'rollbar',
    register: async (server, _options) => {
        const preResponse = (request, h) => {
            const resp = request.response
            if (resp.isBoom) {
                const error = resp instanceof Error ? resp : `Error: ${resp}`
                if (resp.output.statusCode >= 500) {
                    rollbar.error(error, request)
                } else {
                    console.error(error, request)
                }
            }
            return h.continue
        }

        server.ext('onPreResponse', preResponse)
        server.expose('rollbar', rollbar)
    },
}

export default {
    plugin: rollbarPlugin,
    options: {},
}
