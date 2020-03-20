export const strategy = {
    async cacheOnly(cache, req) {
        return cache.match(req)
    },
    async cacheFirst(cache, req) {
        const cached = await cache.match(req)
        return cached || fetch(req)
    },
    async networkOnly(cache, req) {
        return fetch(req)
    },
    async networkFirst(cache, req) {
        const cached = cache.match(req)
        const fetched = fetch(req).then(resp => {
            if (resp.ok) {
                cache.put(req, resp.clone())
            } else {
                cache.delete(req)
            }
            return resp
        })
        const resp = fetched.catch(err => {
            return cached
        })
        return resp
    },
    async staleWhileRevalidate(cache, req) {
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
    },
}
