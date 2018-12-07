const assets = serviceWorkerOption.assets;
assets.push("/");

const files = assets.filter(p => !p.endsWith("json"));
const CACHE_VERSION = files.join(":");
console.log("[SW] current version", CACHE_VERSION);

self.addEventListener("install", event => {
    console.log("[SW] install | start", CACHE_VERSION);
    const done = caches
        .open(CACHE_VERSION)
        .then(cache => cache.addAll(files))
        .then(() => self.skipWaiting())
        .then(() => console.log("[SW] install | done"))
        .catch(err => {
            console.error(err.stack);
            throw err;
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
        .catch(err => {
            console.error(err.stack);
            throw err;
        });
    event.waitUntil(done);
});

const strategies = {
    async cacheOnly(cache, req) {
        return cache.match(req);
    },
    async cacheFirst(cache, req) {
        const cached = await cache.match(req);
        return cached || fetch(req);
    },
    async networkOnly(cache, req) {
        return fetch(req);
    },
    async networkFirst(cache, req) {
        const cached = caches.match(event.request);
        const fetched = fetch(req).then(resp => {
            if (resp.ok) {
                cache.put(req, resp.clone());
            } else {
                cache.delete(req);
            }
            return resp;
        });
        const resp = fetched.catch(err => {
            console.error(err.stack);
            return cached;
        });
        return resp;
    },
    async staleWhileRevalidate(cache, req) {
        const fetched = fetch(req).then(resp => {
            console.log("[SW] revalidate", req.url);
            if (resp.ok) {
                cache.put(req, resp.clone());
            } else {
                cache.delete(req);
            }
            return resp;
        });
        const cached = await cache.match(req);
        return cached || fetched;
    },
    async race(cache, req) {
        const cached = caches
            .match(event.request)
            .cache(err => console.error(err.stack));
        const fetched = fetch(req)
            .then(resp => {
                if (resp.ok) {
                    cache.put(req, resp.clone());
                } else {
                    cache.delete(req);
                }
                return resp;
            })
            .cache(err => console.error(err.stack));
        const timeout = Number(req.headers.get("X-SW-RACE") || "500");
        const timer = new Promise((resolve, reject) =>
            setTimeout(reject, timeout),
        );
        const resp = Promise.race([fetched, timer]).catch(err => cached);
        return resp;
    },
};

const dispatch = async (action, cache, req, resp) => {
    if (!resp.ok) return;
    const [fn, ...args] = action.split(";");
    switch (fn) {
        case "update":
            return cache.put(args[0], resp.clone());
        default:
            console.error(`unknown action: ${action}`);
    }
};

self.addEventListener("fetch", event => {
    const done = caches.open(CACHE_VERSION).then(async cache => {
        const req = event.request;

        // X-SW-STRATEGY: cacheFirst
        // X-SW-RACE: 500
        // X-SW-ACTION: update;url

        const strategy = req.headers.get("X-SW-STRATEGY") || "cacheFirst";
        const resp = await strategies[strategy](cache, req);

        const action = req.headers.get("X-SW-ACTION");
        if (action) dispatch(action, cache, req, resp);

        return resp;
    });
    event.respondWith(done);
});
