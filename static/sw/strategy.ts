export async function cacheOnly(cache: Cache, req: Request | string) {
    return cache.match(req)
}

export async function cacheFirst(cache: Cache, req: Request | string) {
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

export async function networkOnly(_cache: Cache, req: Request | string) {
    return fetch(req)
}

export async function networkFirst(cache: Cache, req: Request | string) {
    const cached = cache.match(req)
    const fetched = fetch(req).then((resp) => {
        if (resp.ok) {
            cache.put(req, resp.clone())
        } else {
            cache.delete(req)
        }
        return resp
    })
    const resp = fetched.catch(async (_err) => cached)
    return resp
}

export async function staleWhileRevalidate(
    cache: Cache,
    req: Request | string,
) {
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
