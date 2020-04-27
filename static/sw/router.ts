// @ts-ignore
import App from '../components/app.html'
import { WorkerRouter } from '../../util/router'
import * as strategy from './strategy'
import { CACHE_VERSION } from './version'

const just = (
    name:
        | 'cacheOnly'
        | 'cacheFirst'
        | 'networkOnly'
        | 'networkFirst'
        | 'staleWhileRevalidate',
) => async (event: FetchEvent) => {
    const cache = await caches.open(CACHE_VERSION)
    const resp = await strategy[name](cache, event.request)
    return resp
}

const getThenUpdate = async (event: FetchEvent) => {
    const cache = await caches.open(CACHE_VERSION)
    const resp = await strategy.networkOnly(cache, event.request)
    if (resp.ok) cache.put('/api/v1/feeds', resp.clone())
    return resp
}

export const router = new WorkerRouter()
    .fallback(just('networkOnly'))
    // homepage
    .get('/', async (event) => {
        const cache = await caches.open(CACHE_VERSION)
        const resp = await strategy.cacheFirst(cache, event.request)

        return Promise.all([
            strategy.cacheOnly(cache, `/api/v1/user`),
            strategy.cacheOnly(cache, `/api/v1/feeds`),
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
                const html = tpl.replace(
                    '<div id="app"></div>',
                    `<div id="app">${
                        app.html
                    }</div><script>window.__STATE__=${JSON.stringify(
                        state,
                    )}</script>`,
                )
                return new Response(html, resp)
            })
            .catch((err) => {
                console.error(err.stack)
                return resp
            })
    })
    // API
    .get('/api/v1/feeds', just('staleWhileRevalidate'))
    .get('/api/v1/user', just('staleWhileRevalidate'))
    .put('/api/v1/feeds/add', getThenUpdate)
    .delete('/api/v1/feeds/remove', getThenUpdate)
    // static
    .get('/sw.js', just('networkOnly'))
    .get('/favicon.ico', just('cacheFirst'))
    .get('/npm/*', just('cacheFirst'))
    .get('/:file', (event, params) => {
        const file = params.get('file')!
        if (file.endsWith('.js')) {
            return just('cacheFirst')(event)
        } else {
            return just('networkOnly')(event)
        }
    })
