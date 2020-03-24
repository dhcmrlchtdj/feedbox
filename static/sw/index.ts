import { router } from './router'
import { version } from './version'

declare const self: ServiceWorkerGlobalScope

console.log('[SW] current version', version)

self.addEventListener('install', (event) => {
    console.log('[SW] install | start', version)
    const done = self
        .skipWaiting()
        .then(() => console.log('[SW] install | done', version))
    event.waitUntil(done)
})

self.addEventListener('activate', (event) => {
    console.log('[SW] activate | start', version)
    const done = self.clients
        .claim()
        .then(() => caches.keys())
        .then((keyList) => {
            const cs = keyList
                .filter((key) => key !== version)
                .map((key) => caches.delete(key))
            return Promise.all(cs)
        })
        .then(() => console.log('[SW] activate | done', version))
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
            .open(version)
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
