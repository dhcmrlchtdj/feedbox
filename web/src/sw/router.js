import App from '../app.html'
import Router from '../utils/router'
import strategies from './strategy'
import dispatch from './action'

export const router = Router.add(
    'get',
    `${process.env.SITE}/`,
    async (cache, req) => {
        const resp = await strategies.cacheFirst(cache, req)
        return Promise.all([
            strategies.cacheOnly(cache, `${process.env.API}/api/v1/user`),
            strategies.cacheOnly(cache, `${process.env.API}/api/v1/feeds`),
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
                    loaded: true,
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
                return new Response(html, {
                    headers: { 'content-type': 'text/html; charset=utf-8' },
                })
            })
            .catch(err => {
                console.error(err.stack)
                return resp
            })
    },
)

export const defaultHandler = async (cache, req) => {
    // X-SW-STRATEGY: cacheFirst
    // X-SW-RACE: 500
    // X-SW-ACTION: update;url

    const strategy = req.headers.get('X-SW-STRATEGY') || 'cacheFirst'
    const resp = await strategies[strategy](cache, req)

    const action = req.headers.get('X-SW-ACTION')
    if (action) dispatch(action, cache, req, resp)

    return resp
}
