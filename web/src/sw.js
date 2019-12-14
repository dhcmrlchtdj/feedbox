import manifest from '../_build/manifest.json'
import route from './sw/route'

const assets = manifest.bundle
const builtins = [
    '/',
    'https://cdn.jsdelivr.net/npm/spectre.css@0.5.8/dist/spectre.min.css',
]

const files = [].concat(assets, builtins)
const CACHE_VERSION = files.join(':')
console.log('[SW] current version', CACHE_VERSION)

self.addEventListener('install', event => {
    console.log('[SW] install | start', CACHE_VERSION)
    const done = caches
        .open(CACHE_VERSION)
        .then(cache => cache.addAll(files))
        .then(() => self.skipWaiting())
        .then(() => console.log('[SW] install | done'))
    event.waitUntil(done)
})

self.addEventListener('activate', event => {
    console.log('[SW] activate | start', CACHE_VERSION)
    const done = caches
        .keys()
        .then(keyList => {
            const cs = keyList
                .filter(key => key !== CACHE_VERSION)
                .map(key => caches.delete(key))
            return Promise.all(cs)
        })
        .then(() => self.clients.claim())
        .then(() => console.log('[SW] activate | done'))
    event.waitUntil(done)
})

self.addEventListener('fetch', event => {
    const done = caches.open(CACHE_VERSION).then(async cache => {
        const req = event.request
        const handler = route(req.method, req.url)
        return handler(cache, req, self)
    })
    event.respondWith(done)
})

self.addEventListener('message', event => {
    console.log('[SW] message |', event.data)

    if (event.data === 'logout') {
        const done = caches
            .open(CACHE_VERSION)
            .then(cache =>
                Promise.all([
                    cache.delete(`${process.env.API}/api/v1/user`),
                    cache.delete(`${process.env.API}/api/v1/feeds`),
                ]),
            )
            .then(() => console.log('[SW] message | done'))
        event.waitUntil(done)
    }
})
