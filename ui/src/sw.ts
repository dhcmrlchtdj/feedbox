import { router } from "./sw/router"
import * as version from "./sw/version"

declare const self: ServiceWorkerGlobalScope

console.log("[SW] current version", version.STATIC, version.API)

self.addEventListener("install", (event) => {
	console.log("[SW] install | start", version.STATIC)
	const done = self
		.skipWaiting()
		.then(() => console.log("[SW] install | done", version.STATIC))
	event.waitUntil(done)
})

self.addEventListener("activate", (event) => {
	console.log("[SW] activate | start", version.STATIC)
	const done = self.clients
		.claim()
		.then(() => caches.keys())
		.then((keyList) => {
			const cs = keyList
				.filter((key) => key !== version.STATIC && key !== version.API)
				.map((key) => caches.delete(key))
			return Promise.all(cs)
		})
		.then(() => console.log("[SW] activate | done", version.STATIC))
	event.waitUntil(done)
})

self.addEventListener("fetch", (event) => {
	console.log("[SW] fetch", event.request.url)
	const found = router.route(event.request)!
	const resp = found.handler({ event, params: found.params })
	event.respondWith(resp)
})

self.addEventListener("message", (event) => {
	console.log("[SW] message |", event.data)
	if (event.data === "logout") {
		const done = caches
			.delete(version.API)
			.then(() => console.log("[SW] message | done", event.data))
		event.waitUntil(done)
	}
})

