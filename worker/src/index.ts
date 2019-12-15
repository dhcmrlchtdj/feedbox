import {} from '@cloudflare/workers-types'

addEventListener('fetch', (event: FetchEvent) => {
    event.respondWith(handle(event.request))
})

const webHost = 'dhcmrlchtdj.github.io'
const apiHost = 'fbox.herokuapp.com'

async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const pathname = url.pathname
    const host = pathname.startsWith('/api') ? apiHost : webHost
    url.host = host
    if (!pathname.startsWith('/api')) url.pathname = '/feedbox' + url.pathname
    const init: RequestInit = {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'manual',
    }
    const req = new Request(url.toString(), init)
    req.headers.set('host', host)
    return fetch(req)
}
