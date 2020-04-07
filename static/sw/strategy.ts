type strategy = (cache: Cache, req: Request | string) => Promise<Response>

export const cacheOnly: strategy = async (cache, req) => {
    const m = await cache.match(req)
    if (m) return m
    return new Response('Cache Not Found', {
        status: 404,
        statusText: 'Not Found',
    })
}

export const cacheFirst: strategy = async (cache, req) => {
    const cached = await cache.match(req)
    if (cached) return cached
    const fetched = fetch(req).then((resp) => {
        if (resp.ok) {
            cache.put(req, resp.clone())
        } else {
            cache.delete(req)
        }
        return resp
    })
    return fetched
}

export const networkOnly: strategy = async (_cache, req) => {
    return fetch(req)
}

export const networkFirst: strategy = async (cache, req) => {
    const cached = cache.match(req)
    const fetched = fetch(req).then((resp) => {
        if (resp.ok) {
            cache.put(req, resp.clone())
        } else {
            cache.delete(req)
        }
        return resp
    })
    const resp = fetched.catch(async (err) => {
        const m = await cached
        if (m) return m
        throw err
    })
    return resp
}

export const staleWhileRevalidate: strategy = async (cache, req) => {
    const fetched = fetch(req).then((resp) => {
        if (resp.ok) {
            cache.put(req, resp.clone())
        } else {
            cache.delete(req)
        }
        return resp
    })
    const cached = await cache.match(req)
    return cached || fetched
}
