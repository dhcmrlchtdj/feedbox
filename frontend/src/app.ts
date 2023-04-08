// @ts-ignore
import App from "./components/app.html"
import "spectre.css"

import {
	Composed,
	DefaultLayer,
	QueryLayer,
	SessionStorageLayer,
} from "./storage.js"

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
		new DefaultLayer("true"),
	)

	if (swEnable.get() === "false" || swEnable.get() === "0") {
		unregisterServiceWorker()
		swEnable.set("false")
	} else {
		navigator.serviceWorker.register("/sw.js")
		swEnable.set("true")
	}
}
