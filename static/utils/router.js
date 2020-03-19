// https://github.com/dhcmrlchtdj/router

const None = {
    isNone: true,
    isSome: false,
    map: _ => None,
    getExn: () => {
        throw new Error('Option.getExn')
    },
}
const Some = data => ({
    isNone: false,
    isSome: true,
    map: f => Some(f(data)),
    getExn: () => data,
})

const pattern = new RegExp('^(?:([^:]+)://([^/]+))?(?:/([^?#]*))*')
function split(uri) {
    const matched = pattern.exec(uri)
    if (matched) {
        const protocol = matched[1] || ''
        const host = matched[2] || ''
        const pathname = matched[3] || ''
        return [protocol, host.toLowerCase(), ...pathname.split('/')]
    } else {
        return [uri]
    }
}
function cloneRoute(node) {
    return {
        entry: node.entry,
        subRoutes: {
            static: Object.assign({}, node.subRoutes.static),
            parameter: Object.assign({}, node.subRoutes.parameter),
            any: Object.assign({}, node.subRoutes.any),
        },
    }
}
function newRoute() {
    return {
        entry: None,
        subRoutes: { static: {}, parameter: {}, any: {} },
    }
}
const _add = (segments, callback, route) => {
    if (segments.length === 0) {
        route.entry = Some(callback)
    } else {
        const seg = segments[0]
        if (seg === '*') {
            const tmp = newRoute()
            tmp.entry = Some(callback)
            route.subRoutes.any['*'] = tmp
        } else if (seg[0] === ':') {
            const param = seg.slice(1)
            const tmp = route.subRoutes.parameter[param]
            const next = _add(
                segments.slice(1),
                callback,
                tmp ? cloneRoute(tmp) : newRoute(),
            )
            route.subRoutes.parameter[param] = next
        } else {
            const tmp = route.subRoutes.static[seg]
            const next = _add(
                segments.slice(1),
                callback,
                tmp ? cloneRoute(tmp) : newRoute(),
            )
            route.subRoutes.static[seg] = next
        }
    }
    return route
}
function add(method, uri, callback) {
    const segments = [method.toUpperCase(), ...split(uri)]
    return route => _add(segments, callback, cloneRoute(route))
}
const _route = (segments, route, params = {}) => {
    if (segments.length === 0) {
        return route.entry.map(cb => [cb, params])
    } else {
        const seg = segments[0]
        const subSeg = segments.slice(1)
        const staticRoute = route.subRoutes.static[seg]
        if (staticRoute) {
            const matched = _route(subSeg, staticRoute, params)
            if (matched.isSome) return matched
        }
        const paramRouters = Object.entries(route.subRoutes.parameter)
        for (const [param, paramRouter] of paramRouters) {
            const paramsParams = Object.assign({}, params, { [param]: seg })
            const matched = _route(subSeg, paramRouter, paramsParams)
            if (matched.isSome) return matched
        }
        const anyRoute = route.subRoutes.any['*']
        if (anyRoute) {
            const anyParams = Object.assign({}, params, {
                '*': segments.join('/'),
            })
            return anyRoute.entry.map(cb => [cb, anyParams])
        }
        return None
    }
}
function route(method, uri) {
    const segments = [method.toUpperCase(), ...split(uri)]
    return route => _route(segments, route)
}

class Router {
    constructor(_route) {
        this._route = _route
    }
    add(method, uri, callback) {
        const route$$1 = add(method, uri, callback)(this._route)
        return new Router(route$$1)
    }
    route(method, uri) {
        return route(method, uri)(this._route)
    }
}
var mod = new Router(newRoute())

export default mod
export { newRoute, add, route }
