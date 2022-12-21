// @ts-ignore
import App from "./components/app.html"
import { Composed, QueryLayer, SessionStorageLayer } from "./storage"

new App({
	target: document.querySelector("#app"),
	hydrate: true,
})

const unregisterServiceWorker = async () => {
	const workers = await navigator.serviceWorker.getRegistrations()
	await Promise.all(workers.map((worker) => worker.unregister()))

	const cacheKeys = await caches.keys()
	await Promise.all(cacheKeys.map((key) => caches.delete(key)))
}

if (navigator.serviceWorker) {
	const swEnable = new Composed(
		new QueryLayer("sw", new URLSearchParams(location.search)),
		new SessionStorageLayer("swEnable"),
	)

	if (swEnable.get() === "false" || swEnable.get() === "0") {
		unregisterServiceWorker()
		swEnable.set("false")
	} else {
		navigator.serviceWorker.register("/sw.js")
		swEnable.set("true")
	}
}
