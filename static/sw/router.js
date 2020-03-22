import App from '../components/app.html'
import { Router } from '../utils/router'
import * as strategy from './strategy'

export const initRouter = (cacheVersion) => {
    const oneStrategy = (name) => async (event) => {
        const cache = await caches.open(cacheVersion)
        const resp = await strategy[name](cache, event.request)
        return resp
    }

    const getThenUpdate = async (event) => {
        const cache = await caches.open(cacheVersion)
        const resp = await strategy.networkOnly(cache, event.request)
        if (resp.ok) cache.put('/api/v1/feeds', resp.clone())
        return resp
    }

    const router = new Router()
    router
        .get('/', async (event) => {
            const cache = await caches.open(cacheVersion)
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
                        email: user.email,
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
        .put('/api/v1/feeds/add', getThenUpdate)
        .delete('/api/v1/feeds/remove', getThenUpdate)
        .get('/api/v1/user', oneStrategy('staleWhileRevalidate'))
        .get('/api/v1/feeds', oneStrategy('staleWhileRevalidate'))
        .get('/api/v1/feeds/export', oneStrategy('networkOnly'))
        .fallback(oneStrategy('cacheFirst'))
    return router
}
