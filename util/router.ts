/*
Usage:

```javascript
import { Router } from 'path/to/router'

// build router
const router = new Router()

router.fallback(async (event) => {
    fetch(event.request)
})

router.get('/static', async (event, params) => {
    fetch(event.request)
})
router.post('/param/:id/:title', async (event, params) => {
    assert(params.has('id'))
    assert(params.has('title'))
    return fetch(event.request)
})
router.head('/any/*', async (event, params) => {
    assert(params.has('*'))
    return fetch(event.request)
})

// route the fetch event
router.route(event)
```
*/

/// <reference lib="webworker" />

type Params = Map<string, string>
type Handler = (event: FetchEvent, params: Params) => Promise<Response>
type Route = {
    handler: Handler | null
    static: Map<string, Route>
    parameter: Map<string, Route>
    any: Route | undefined
}

const newRoute = (): Route => {
    return {
        handler: null,
        static: new Map(),
        parameter: new Map(),
        any: undefined,
    }
}

const handleNotFound: Handler = async () =>
    new Response('Not Found', { status: 404 })

export class Router {
    private routes: Route
    private defaultHandler: Handler
    constructor() {
        this.routes = newRoute()
        this.defaultHandler = handleNotFound
    }

    fallback(handler: Handler): Router {
        this.defaultHandler = handler
        return this
    }

    private _add(routes: Route, segments: string[], handler: Handler) {
        if (segments.length === 0) {
            routes.handler = handler
        } else {
            const seg = segments[0]
            if (seg === '*') {
                const r = newRoute()
                r.handler = handler
                routes.any = r
            } else if (seg[0] === ':') {
                const param = seg.slice(1)
                const r = routes.parameter.get(param) ?? newRoute()
                this._add(r, segments.slice(1), handler)
                routes.parameter.set(param, r)
            } else {
                const r = routes.static.get(seg) ?? newRoute()
                this._add(r, segments.slice(1), handler)
                routes.static.set(seg, r)
            }
        }
    }
    add(method: string, pathname: string, handler: Handler): Router {
        const segments = [method.toUpperCase(), ...pathname.split('/')]
        this._add(this.routes, segments, handler)
        return this
    }
    head(pathname: string, handler: Handler): Router {
        return this.add('HEAD', pathname, handler)
    }
    get(pathname: string, handler: Handler): Router {
        return this.add('GET', pathname, handler)
    }
    post(pathname: string, handler: Handler): Router {
        return this.add('POST', pathname, handler)
    }
    put(pathname: string, handler: Handler): Router {
        return this.add('PUT', pathname, handler)
    }
    delete(pathname: string, handler: Handler): Router {
        return this.add('DELETE', pathname, handler)
    }

    private _route(
        routes: Route,
        segments: string[],
        params: Params,
    ): Handler | null {
        if (segments.length === 0) {
            return routes.handler
        } else {
            const seg = segments[0]
            const subSeg = segments.slice(1)

            const staticRoutes = routes.static.get(seg)
            if (staticRoutes) {
                const handler = this._route(staticRoutes, subSeg, params)
                if (handler !== null) return handler
            }

            if (seg !== '') {
                const paramRouters = routes.parameter.entries()
                for (const [param, paramRouter] of paramRouters) {
                    const handler = this._route(paramRouter, subSeg, params)
                    if (handler !== null) {
                        params.set(param, seg)
                        return handler
                    }
                }
            }

            if (routes.any !== undefined) {
                params.set('*', segments.join('/'))
                return routes.any.handler
            }
            return null
        }
    }
    route(event: FetchEvent): Promise<Response> {
        const request = event.request
        const url = new URL(request.url)
        const segments = [
            request.method.toUpperCase(),
            ...url.pathname.split('/'),
        ]
        const params = new Map()
        const handler =
            this._route(this.routes, segments, params) ?? this.defaultHandler
        const resp = handler(event, params)
        return resp
    }
}
