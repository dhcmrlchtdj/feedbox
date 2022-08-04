// @ts-ignore
import App from '../components/app.html'
import { WorkerRouter } from './worker_router'
import * as strategy from './strategy'
import * as version from './version'

const just =
    (
        cacheName: string,
        strategyName:
            | 'cacheOnly'
            | 'cacheFirst'
            | 'networkOnly'
            | 'networkFirst',
    ) =>
    async (event: FetchEvent) => {
        const cache = await caches.open(cacheName)
        const resp = await strategy[strategyName](cache, event.request)
        return resp
    }

const getThenUpdate = async (event: FetchEvent) => {
    const cache = await caches.open(version.API)
    const resp = await strategy.networkOnly(cache, event.request)
    if (resp.ok) cache.put('/api/v1/feeds', resp.clone())
    return resp
}

export const router = new WorkerRouter()
    .fallback(just(version.API, 'networkOnly'))
    // homepage
    .get('/', async (event) => {
        const apiCache = await caches.open(version.API)
        const staticCache = await caches.open(version.STATIC)

        const resp = await strategy.cacheFirst(staticCache, event.request)
        return Promise.all([
            strategy.cacheOnly(apiCache, `/api/v1/user`),
            strategy.cacheOnly(apiCache, `/api/v1/feeds`),
        ])
            .then(async ([user, feeds]) => {
                if (user && feeds) {
                    return Promise.all([user.json(), feeds.json()])
                } else {
                    throw new Error('cache missing')
                }
            })
            .then(async ([user, feeds]) => {
                const state = {
                    loaded: { promise: true },
                    email: user.addition.email,
                    feeds: feeds,
                }
                const tpl = await resp.clone().text()
                const app = App.render(state)
                const __STATE__ = JSON.stringify(state)
                const html = tpl.replace(
                    '<div id="app"></div>',
                    `<div id="app">${app.html}</div><script>window.__STATE__=${__STATE__}</script>`,
                )
                return new Response(html, resp)
            })
            .catch((err) => {
                console.error(err.stack)
                return resp
            })
    })
    // API
    .get('/api/v1/feeds', just(version.API, 'networkFirst'))
    .get('/api/v1/user', just(version.API, 'networkFirst'))
    .put('/api/v1/feeds/add', getThenUpdate)
    .delete('/api/v1/feeds/remove', getThenUpdate)
    // static
    .get('/sw.js', just(version.STATIC, 'networkOnly'))
    .get('/favicon.ico', just(version.STATIC, 'cacheFirst'))
    .get('/npm/*', just(version.STATIC, 'cacheFirst'))
    .get('/:file', (event, params) => {
        const file = params.get('file')!
        if (file.endsWith('.js')) {
            return just(version.STATIC, 'cacheFirst')(event)
        } else {
            return just(version.STATIC, 'networkOnly')(event)
        }
    })
