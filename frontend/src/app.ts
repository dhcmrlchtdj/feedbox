// @ts-ignore
import App from './components/app.html'

new App({
    target: document.querySelector('#app'),
    hydrate: true,
})

const unregisterServiceWorker = async () => {
    const workers = await navigator.serviceWorker.getRegistrations()
    await Promise.all(workers.map((worker) => worker.unregister()))

    const cacheKeys = await caches.keys()
    await Promise.all(cacheKeys.map((key) => caches.delete(key)))
}

if (navigator.serviceWorker) {
    const query = new URLSearchParams(location.search)
    const sw = query.get('sw')
    if (sw === '0') {
        unregisterServiceWorker()
    } else {
        navigator.serviceWorker.register('/sw.js')
    }
}
