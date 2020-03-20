import { bundle } from '../../_build/static/manifest.json'
import { initRouter } from './router'

const files = [
    ...bundle,
    'favicon.ico',
    '/',
    'https://cdn.jsdelivr.net/npm/spectre.css@0.5.8/dist/spectre.min.css',
]
const CACHE_VERSION = files.join(':')
console.log('[SW] current version', CACHE_VERSION)

const router = initRouter(CACHE_VERSION)

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
    event.respondWith(router.route(event))
})

self.addEventListener('message', event => {
    console.log('[SW] message |', event.data)
    if (event.data === 'logout') {
        const done = caches
            .open(CACHE_VERSION)
            .then(cache =>
                Promise.all([
                    cache.delete(`/api/v1/user`),
                    cache.delete(`/api/v1/feeds`),
                ]),
            )
            .then(() => console.log('[SW] message | done'))
        event.waitUntil(done)
    }
})
