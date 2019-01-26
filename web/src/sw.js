import Router from "./utils/router";
import manifest from "../_build/manifest.json";
import App from "./app.html";

const assets = manifest.bundle;
const builtins = [
    "/",
    "https://cdn.jsdelivr.net/npm/spectre.css@0.5.7/dist/spectre.min.css",
];

const files = [].concat(assets, builtins);
const CACHE_VERSION = files.join(":");
console.log("[SW] current version", CACHE_VERSION);

self.addEventListener("install", event => {
    console.log("[SW] install | start", CACHE_VERSION);
    const done = caches
        .open(CACHE_VERSION)
        .then(cache => cache.addAll(files))
        .then(() => self.skipWaiting())
        .then(() => console.log("[SW] install | done"));
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
        .then(() => console.log("[SW] activate | done"));
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
            console.error(err);
            return cached;
        });
        return resp;
    },
    async staleWhileRevalidate(cache, req) {
        const fetched = fetch(req).then(resp => {
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
        const cached = caches.match(event.request);
        const fetched = fetch(req).then(resp => {
            if (resp.ok) {
                cache.put(req, resp.clone());
            } else {
                cache.delete(req);
            }
            return resp;
        });
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

const router = Router.add("get", `${process.env.SITE}/`, async (cache, req) => {
    const resp = await strategies.cacheFirst(cache, req);
    const API = process.env.API;
    return Promise.all([
        strategies.cacheOnly(cache, `${API}/api/v1/user`),
        strategies.cacheOnly(cache, `${API}/api/v1/feeds`),
    ])
        .then(([user, feeds]) => Promise.all([user.json(), feeds.json()]))
        .then(([user, feeds]) => ({ email: user.email, feeds: feeds }))
        .then(async state => {
            const tpl = await resp.clone().text();
            const app = App.render(state);
            const html = tpl.replace(
                '<div id="app"></div>',
                `<div id="app">${
                    app.html
                }</div><script>window.__STATE__=${JSON.stringify(
                    state,
                )}</script>`,
            );
            return new Response(html, {
                headers: { "content-type": "text/html; charset=utf-8" },
            });
        })
        .catch(err => {
            console.log(err);
            return resp;
        });
});
const fallbackRouter = async (cache, req) => {
    // X-SW-STRATEGY: cacheFirst
    // X-SW-RACE: 500
    // X-SW-ACTION: update;url

    const strategy = req.headers.get("X-SW-STRATEGY") || "cacheFirst";
    const resp = await strategies[strategy](cache, req);

    const action = req.headers.get("X-SW-ACTION");
    if (action) dispatch(action, cache, req, resp);

    return resp;
};

self.addEventListener("fetch", event => {
    const done = caches.open(CACHE_VERSION).then(async cache => {
        const req = event.request;
        const fnOpt = router.route(req.method, req.url);
        const fn = fnOpt.isSome ? fnOpt.getExn()[0] : fallbackRouter;
        return fn(cache, req);
    });
    event.respondWith(done);
});
