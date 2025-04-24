import {
	Composed,
	DefaultLayer,
	QueryLayer,
	SessionStorageLayer,
} from "./shared/storage.ts"

const unregisterServiceWorker = async () => {
	const workers = await navigator.serviceWorker.getRegistrations()
	await Promise.all(workers.map((worker) => worker.unregister()))

	const cacheKeys = await caches.keys()
	await Promise.all(cacheKeys.map((key) => caches.delete(key)))
}

const genSwUrl = (s: string): string => {
	if (window.trustedTypes) {
		const scriptPolicy = window.trustedTypes.createPolicy("sw", {
			createScriptURL: (x) => x,
		})
		return scriptPolicy.createScriptURL(s) as unknown as string
	} else {
		return s
	}
}

export function registerServiceWorker() {
	if (!navigator.serviceWorker) return
	const swEnable = new Composed(
		new QueryLayer("sw", new URLSearchParams(location.search)),
		new SessionStorageLayer("swEnable"),
		new DefaultLayer("true"),
	)

	if (swEnable.get() === "false" || swEnable.get() === "0") {
		unregisterServiceWorker()
		swEnable.set("false")
	} else {
		navigator.serviceWorker.register(genSwUrl("/sw.js"), {
			updateViaCache: "all",
		})
		swEnable.set("true")
	}
}
