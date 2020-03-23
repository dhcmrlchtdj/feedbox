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
    private _add(segments: string[], handler: T, route: Route<T>): this {
        if (segments.length === 0) {
            route.handler = handler
        } else {
            const seg = segments[0]
            if (seg === '*') {
                route.wildcard = handler
            } else if (seg[0] === ':') {
                const param = seg.slice(1)
                const r = route.parameter.get(param) ?? this._newRoute()
                this._add(segments.slice(1), handler, r)
                route.parameter.set(param, r)
            } else {
                const r = route.static.get(seg) ?? this._newRoute()
                this._add(segments.slice(1), handler, r)
                route.static.set(seg, r)
            }
        }
        return this
    }
    add(segments: string[], handler: T): this {
        return this._add(segments, handler, this._route)
    }
    private _lookup(
        segments: string[],
        params: Map<string, string>,
        route: Route<T>,
    ): { handler: T | null; params: Map<string, string> } {
        if (segments.length === 0) {
            if (route.handler !== null) {
                return { handler: route.handler, params }
            }
        } else {
            const seg = segments[0]
            const subSeg = segments.slice(1)

            const staticRoute = route.static.get(seg)
            if (staticRoute !== undefined) {
                const matched = this._lookup(subSeg, params, staticRoute)
                if (matched.handler !== null) return matched
            }

            if (seg !== '') {
                for (const [param, paramRoute] of route.parameter) {
                    const matched = this._lookup(subSeg, params, paramRoute)
                    if (matched.handler !== null) {
                        matched.params.set(param, seg)
                        return matched
                    }
                }
            }

            if (route.wildcard !== null) {
                params.set('*', segments.join('/'))
                return { handler: route.wildcard, params }
            }
        }
        return { handler: null, params }
    }
    lookup(segments: string[]) {
        return this._lookup(segments, new Map(), this._route)
    }
}

export type Handler = (
    event: FetchEvent,
    params: Map<string, string>,
) => Promise<Response>
export class WorkerRouter {
    private _router: BaseRouter<Handler>
    constructor() {
        this._router = new BaseRouter<Handler>()
    }

    private async defaultHandler(
        _event: FetchEvent,
        _params: Map<string, string>,
    ) {
        return new Response('Handler Not Found', {
            status: 404,
            statusText: 'Not Found',
        })
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
        const matched = this._router.lookup(segments)
        const handler = matched.handler ?? this.defaultHandler
        const resp = handler(event, matched.params)
        return resp
    }
}
