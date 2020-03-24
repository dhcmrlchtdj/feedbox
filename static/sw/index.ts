import { router } from './router'
import { CACHE_VERSION } from './version'

declare const self: ServiceWorkerGlobalScope

console.log('[SW] current version', CACHE_VERSION)

self.addEventListener('install', (event) => {
    console.log('[SW] install | start', CACHE_VERSION)
    const done = self
        .skipWaiting()
        .then(() => console.log('[SW] install | done', CACHE_VERSION))
    event.waitUntil(done)
})

self.addEventListener('activate', (event) => {
    console.log('[SW] activate | start', CACHE_VERSION)
    const done = self.clients
        .claim()
        .then(() => caches.keys())
        .then((keyList) => {
            const cs = keyList
                .filter((key) => key !== CACHE_VERSION)
                .map((key) => caches.delete(key))
            return Promise.all(cs)
        })
        .then(() => console.log('[SW] activate | done', CACHE_VERSION))
    event.waitUntil(done)
})

self.addEventListener('fetch', (event) => {
    console.log('[SW] fetch', event.request.url)
    event.respondWith(router.route(event))
})

self.addEventListener('message', (event) => {
    console.log('[SW] message |', event.data)
    if (event.data === 'logout') {
        const done = caches
            .open(CACHE_VERSION)
            .then((cache) =>
                Promise.all([
                    cache.delete(`/api/v1/user`),
                    cache.delete(`/api/v1/feeds`),
                ]),
            )
            .then(() => console.log('[SW] message | done', event.data))
        event.waitUntil(done)
    }
})
