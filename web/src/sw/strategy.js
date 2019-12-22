const strategies = {
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
        const cached = caches.match(event.request)
        const fetched = fetch(req).then(resp => {
            if (resp.ok) {
                cache.put(req, resp.clone())
            } else {
                cache.delete(req)
            }
            return resp
        })
        const resp = fetched.catch(err => {
            console.error(err.stack)
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
    async race(cache, req) {
        const cached = caches.match(event.request)
        const fetched = fetch(req).then(resp => {
            if (resp.ok) {
                cache.put(req, resp.clone())
            } else {
                cache.delete(req)
            }
            return resp
        })
        const timeout = Number(req.headers.get('X-SW-RACE') || '500')
        const timer = new Promise((_, reject) => setTimeout(reject, timeout))
        const resp = Promise.race([fetched, timer]).catch(err => cached)
        return resp
    },
}

export default strategies
