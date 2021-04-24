import { buildApp, buildServiceWorker } from './build_common.js'

main()

async function main() {
    await Promise.all([buildApp(true), buildServiceWorker(true)])
}
