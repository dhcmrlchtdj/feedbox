const dotenv = require('dotenv-safe')
const replace = require('@rollup/plugin-replace')

exports.dotenv = dotenvConfig => {
    dotenv.config(dotenvConfig)

    const envs = {}
    Object.entries(process.env).forEach(([key, value]) => {
        envs[`process.env.${key}`] = JSON.stringify(value)
    })

    return replace(envs)
}
