import * as dotenv from 'dotenv-safe'
import replace from '@rollup/plugin-replace'

export default dotenvConfig => {
    dotenv.config(dotenvConfig)

    const envs = {}
    Object.entries(process.env).forEach(([key, value]) => {
        envs[`process.env.${key}`] = JSON.stringify(value)
    })

    return replace(envs)
}
