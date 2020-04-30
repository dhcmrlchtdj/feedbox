import type {} from '@cloudflare/workers-types'

const apiHost = 'fbox.herokuapp.com'

const handle = (event: FetchEvent) => {
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

addEventListener('fetch', (event) => {
    const resp = handle(event)
    event.respondWith(resp)
})
