// @ts-ignore
import App from "./components/app.html"

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

class LocalState {
	getLocal(key: string): string | null {
		try {
			const val = localStorage.getItem(key)
			return val
		} catch (err) {
			console.error(err)
			return null
		}
	}
	setLocal(key: string, value: string) {
		try {
			localStorage.setItem(key, value)
		} catch (err) {
			console.error(err)
		}
	}

	getQuery(key: string): string | null {
		const query = new URLSearchParams(location.search)
		return query.get(key)
	}

	getQueryOrLocal(
		queryKey: string,
		localKey: string,
		defaultValue: string,
	): string {
		const query = this.getQuery(queryKey)
		if (query) return query
		const local = this.getLocal(localKey)
		if (local) return local
		return defaultValue
	}
}

if (navigator.serviceWorker) {
	const localState = new LocalState()
	const swEnable = localState.getQueryOrLocal("sw", "sw-enable", "true")

	if (swEnable === "false" || swEnable === "0") {
		unregisterServiceWorker()
		localState.setLocal("sw-enable", "false")
	} else {
		navigator.serviceWorker.register("/sw.js")
		localState.setLocal("sw-enable", "true")
	}
}
