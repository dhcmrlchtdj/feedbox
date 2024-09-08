import { hydrate } from "preact"
import { jsx } from "preact/jsx-runtime"
import "spectre.css"
import { App } from "./components/app.tsx"
import { initState } from "./shared/state.ts"
import {
	Composed,
	DefaultLayer,
	QueryLayer,
	SessionStorageLayer,
} from "./shared/storage.ts"

///

initState()
hydrate(jsx(App, {}), document.querySelector("#app")!)

///

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
		navigator.serviceWorker.register("/sw.js", { updateViaCache: "all" })
		swEnable.set("true")
	}
}
