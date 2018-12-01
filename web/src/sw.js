const assets = serviceWorkerOption.assets;
assets.push("/");

const cacheFirst = assets.filter(p => !p.endsWith("json"));
const staleWhileRevalidate = [`${process.env.API}/api/v1/user`];

const CACHE_VERSION = cacheFirst.join(":");
console.log("[SW] current version", CACHE_VERSION);

self.addEventListener("install", event => {
    console.log("[SW] install | start", CACHE_VERSION);
    const done = caches
        .open(CACHE_VERSION)
        .then(cache => cache.addAll(cacheFirst))
        .then(() => self.skipWaiting())
        .then(() => console.log("[SW] install | done"))
        .catch(error => {
            console.error(error);
            throw error;
        });
    event.waitUntil(done);
});

self.addEventListener("activate", event => {
    console.log("[SW] activate | start", CACHE_VERSION);
    const done = caches
        .keys()
        .then(keyList => {
            const cs = keyList
                .filter(key => key !== CACHE_VERSION)
                .map(key => caches.delete(key));
            return Promise.all(cs);
        })
        .then(() => self.clients.claim())
        .then(() => console.log("[SW] activate | done"))
        .catch(error => {
            console.error(error);
            throw error;
        });
    event.waitUntil(done);
});

const strategyCacheFirst = async (cache, req) => {
    const cached = await cache.match(req);
    return cached || fetch(req);
};
const strategyStaleWhileRevalidate = async (cache, req) => {
    const fetched = fetch(req).then(resp => {
        console.log("[SW] revalidate", req.url);
        cache.put(req, resp.clone());
        return resp;
    });
    const cached = await cache.match(req);
    return cached || fetched;
};
self.addEventListener("fetch", event => {
    const done = caches.open(CACHE_VERSION).then(cache => {
        const req = event.request;
        if (staleWhileRevalidate.includes(req.url)) {
            return strategyStaleWhileRevalidate(cache, req);
        } else {
            return strategyCacheFirst(cache, req);
        }
    });
    event.respondWith(done);
});
