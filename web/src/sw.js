const assets = serviceWorkerOption.assets;
assets.push("/");

const assetsToCache = assets.filter(p => !p.endsWith("json"));
const CACHE_VERSION = assetsToCache.join(":");
console.log("[SW] current version", CACHE_VERSION);

self.addEventListener("install", event => {
    console.log("[SW] install | start", CACHE_VERSION);
    const done = caches
        .open(CACHE_VERSION)
        .then(cache => cache.addAll(assetsToCache))
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

self.addEventListener("fetch", event => {
    const done = caches
        .open(CACHE_VERSION)
        .then(cache => cache.match(event.request))
        .then(resp => resp || fetch(event.request));
    event.respondWith(done);
});
