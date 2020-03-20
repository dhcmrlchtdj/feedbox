const apiHost = 'fbox.herokuapp.com'

const redirect = async event => {
    const request = event.request
    const url = new URL(request.url)
    url.host = apiHost
    const req = new Request(url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'manual',
    })
    req.headers.set('host', apiHost)
    return fetch(req)
}

const redirectWithCache = async event => {
    const request = event.request

    const cache = caches.default
    const m = await cache.match(request)
    if (m) return m

    const resp = await redirect(event)
    if (resp.ok) {
        const etag = resp.headers.get('etag')
        if (etag) {
            event.waitUntil(cache.put(request, resp.clone()))
        }
    }

    return resp
}

const handle = event => {
    const method = event.request.method.toUpperCase()
    if (method === 'GET' || method === 'HEAD') {
        return redirectWithCache(event)
    } else {
        return redirect(event)
    }
}

addEventListener('fetch', async event => {
    event.respondWith(handle(event))
})
