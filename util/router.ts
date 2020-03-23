export type Params = Map<string, string>

type Route<T> = {
    handler: T | null
    static: Map<string, Route<T>>
    parameter: Map<string, Route<T>>
    wildcard: T | null
}

class BaseRouter<T> {
    private _route: Route<T>
    constructor() {
        this._route = this._newRoute()
    }
    private _newRoute(): Route<T> {
        return {
            handler: null,
            static: new Map(),
            parameter: new Map(),
            wildcard: null,
        }
    }
    add(segments: string[], handler: T, route: Route<T> = this._route): this {
        if (segments.length === 0) {
            route.handler = handler
        } else {
            const seg = segments[0]
            if (seg === '*') {
                route.wildcard = handler
            } else if (seg[0] === ':') {
                const param = seg.slice(1)
                const r = route.parameter.get(param) ?? this._newRoute()
                this.add(segments.slice(1), handler, r)
                route.parameter.set(param, r)
            } else {
                const r = route.static.get(seg) ?? this._newRoute()
                this.add(segments.slice(1), handler, r)
                route.static.set(seg, r)
            }
        }
        return this
    }
    lookup(
        segments: string[],
        params: Params = new Map(),
        route: Route<T> = this._route,
    ): [T, Params] | null {
        if (segments.length === 0) {
            if (route.handler !== null) {
                return [route.handler, params]
            }
        } else {
            const seg = segments[0]
            const subSeg = segments.slice(1)

            const staticRoute = route.static.get(seg)
            if (staticRoute !== undefined) {
                const matched = this.lookup(subSeg, params, staticRoute)
                if (matched !== null) return matched
            }

            if (seg !== '') {
                for (const [param, paramRoute] of route.parameter) {
                    const matched = this.lookup(subSeg, params, paramRoute)
                    if (matched !== null) {
                        params.set(param, seg)
                        return matched
                    }
                }
            }

            if (route.wildcard !== null) {
                params.set('*', segments.join('/'))
                return [route.wildcard, params]
            }
        }
        return null
    }
}

export type Handler = (event: FetchEvent, params: Params) => Promise<Response>
export class WorkerRouter {
    private _router: BaseRouter<Handler>
    constructor() {
        this._router = new BaseRouter<Handler>()
    }

    private async defaultHandler(_event: FetchEvent, _params: Params) {
        return new Response('Not Found', { status: 404 })
    }
    fallback(handler: Handler): this {
        this.defaultHandler = handler
        return this
    }

    add(method: string, pathname: string, handler: Handler): this {
        const segments = [method.toUpperCase(), ...pathname.split('/')]
        this._router.add(segments, handler)
        return this
    }
    all(pathname: string, handler: Handler): this {
        return this.add(':METHOD', pathname, handler)
    }
    head(pathname: string, handler: Handler): this {
        return this.add('HEAD', pathname, handler)
    }
    get(pathname: string, handler: Handler): this {
        return this.add('GET', pathname, handler)
    }
    post(pathname: string, handler: Handler): this {
        return this.add('POST', pathname, handler)
    }
    put(pathname: string, handler: Handler): this {
        return this.add('PUT', pathname, handler)
    }
    delete(pathname: string, handler: Handler): this {
        return this.add('DELETE', pathname, handler)
    }

    route(event: FetchEvent): Promise<Response> {
        const request = event.request
        const url = new URL(request.url)
        const segments = [
            request.method.toUpperCase(),
            ...url.pathname.split('/'),
        ]
        const [handler, params] = this._router.lookup(segments) ?? [
            this.defaultHandler,
            new Map(),
        ]
        const resp = handler(event, params)
        return resp
    }
}
