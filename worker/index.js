addEventListener('fetch', event => {
    event.respondWith(handle(event.request))
})

async function handle(request) {
    const apiHost = "fbox.herokuapp.com"
    const url = new URL(request.url)
    url.host = apiHost
    const init = {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'manual',
    }
    const req = new Request(url, init)
    req.headers.set('host', apiHost)
    return fetch(req)
}
