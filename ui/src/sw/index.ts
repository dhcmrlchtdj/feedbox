import { router } from "./router.js"
import * as version from "./version.js"

declare const self: ServiceWorkerGlobalScope

console.debug("[SW] current version", version.STATIC, version.API)

self.addEventListener("install", (event) => {
	console.debug("[SW] install | start", version.STATIC)
	const done = self
		.skipWaiting()
		.then(() => console.debug("[SW] install | done", version.STATIC))
	event.waitUntil(done)
})

self.addEventListener("activate", (event) => {
	console.debug("[SW] activate | start", version.STATIC)
	const done = self.clients
		.claim()
		.then(() => caches.keys())
		.then((keyList) => {
			const cs = keyList
				.filter((key) => key !== version.STATIC && key !== version.API)
				.map((key) => caches.delete(key))
			return Promise.all(cs)
		})
		.then(() => console.debug("[SW] activate | done", version.STATIC))
	event.waitUntil(done)
})

self.addEventListener("fetch", (event) => {
	console.debug("[SW] fetch", event.request.url)
	const found = router.route(event.request)!
	const resp = found.handler({ event, params: found.params })
	event.respondWith(resp)
})

self.addEventListener("message", (event) => {
	console.debug("[SW] message |", event.data)
	if (event.data === "logout") {
		const done = caches
			.delete(version.API)
			.then(() => console.debug("[SW] message | done", event.data))
		event.waitUntil(done)
	}
})
