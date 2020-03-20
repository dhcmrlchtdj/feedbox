export async function cacheOnly(cache, req) {
    return cache.match(req)
}
export async function cacheFirst(cache, req) {
    const cached = await cache.match(req)
    if (cached) return cached
    const fetched = fetch(req).then(resp => {
        if (resp.ok) {
            cache.put(req, resp.clone())
        } else {
            cache.delete(req)
        }
        return resp
    })
    return fetched
}

export async function networkOnly(cache, req) {
    return fetch(req)
}

export async function networkFirst(cache, req) {
    const cached = cache.match(req)
    const fetched = fetch(req).then(resp => {
        if (resp.ok) {
            cache.put(req, resp.clone())
        } else {
            cache.delete(req)
        }
        return resp
    })
    const resp = fetched.catch(err => cached)
    return resp
}

export async function staleWhileRevalidate(cache, req) {
    const fetched = fetch(req).then(resp => {
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
