import App from '../components/app.html'
import { router as Router } from '../utils/router'
import { strategies } from './strategy'
import { dispatch } from './action'

export const router = Router.add(
    'get',
    `${process.env.WEB}/`,
    async (cache, req, worker) => {
        const resp = await strategies.cacheFirst(cache, req)
        return Promise.all([
            strategies.cacheOnly(cache, `${process.env.SERVER}/api/v1/user`),
            strategies.cacheOnly(cache, `${process.env.SERVER}/api/v1/feeds`),
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

export const defaultHandler = async (cache, req, worker) => {
    // X-SW-STRATEGY: cacheFirst
    // X-SW-RACE: 500
    // X-SW-ACTION: act1 | act2;arg1;arg2 | update;url

    const strategy = req.headers.get('X-SW-STRATEGY') || 'cacheFirst'
    const resp = await strategies[strategy](cache, req)

    const actions = req.headers.get('X-SW-ACTIONS')
    if (actions) dispatch(actions, cache, req, resp, worker)

    return resp
}
