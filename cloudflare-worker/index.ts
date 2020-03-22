/// <reference lib="webworker" />

import {} from '@cloudflare/workers-types'
import { Router } from '../util/router'

// // https://github.com/cloudflare/workers-types/issues/8
// interface Caches {
//     default: {
//         put(request: Request | string, response: Response): Promise<undefined>
//         match(request: Request | string): Promise<Response | undefined>
//     }
// }
// declare const caches: Caches

const apiHost = 'fbox.herokuapp.com'

const direct = async (event) => {
    const request = event.request

    const url = new URL(request.url)
    url.host = apiHost
    const req = new Request(url.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'manual',
    })
    req.headers.set('host', apiHost)

    return fetch(req)
}

// const withCache = async (event) => {
//     const cache = await caches.default
//     const request = event.request
//     const m = await cache.match(request)
//     if (m) return m
//
//     const resp = await direct(event)
//     if (resp.status === 200) {
//         event.waitUntil(cache.put(request, resp.clone()))
//     }
//
//     return resp
// }

const router = new Router()
router.fallback(direct)
// .get('/:file', async (event, params) => {
//     const file = params.get('file')!
//     if (file.startsWith('sw.js')) return direct(event)
//
//     return withCache(event)
// })

addEventListener('fetch', (event) => {
    const resp = router.route(event)
    event.respondWith(resp)
})
