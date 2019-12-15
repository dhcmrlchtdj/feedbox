import {} from '@cloudflare/workers-types'

addEventListener('fetch', (event: FetchEvent) => {
    event.respondWith(handle(event.request))
})

const apiHost = 'fbox.herokuapp.com'

async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url)
    url.host = apiHost
    const init: RequestInit = {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'manual',
    }
    const req = new Request(url.toString(), init)
    req.headers.set('host', apiHost)
    return fetch(req)
}
