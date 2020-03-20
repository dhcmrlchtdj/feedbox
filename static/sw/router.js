import App from '../components/app.html'
import { Router } from '../utils/router'
import { strategy } from './strategy'
import { dispatch } from './action'

export const initRouter = cacheVersion => {
    const router = new Router()

    router.fallback(async event => {
        const cache = await caches.open(cacheVersion)
        const req = event.request

        const s = req.headers.get('X-SW-STRATEGY') || 'cacheFirst'
        const resp = await strategy[s](cache, req)

        const actions = req.headers.get('X-SW-ACTIONS')
        if (actions) dispatch(actions, cache, req, resp)

        return resp
    })

    router.get('/', async event => {
        const cache = await caches.open(cacheVersion)
        const req = event.request
        const resp = await strategy.cacheFirst(cache, req)

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
                return new Response(html, { headers: resp.headers })
            })
            .catch(err => {
                console.error(err.stack)
                return resp
            })
    })

    return router
}
