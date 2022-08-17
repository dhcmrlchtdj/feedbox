// @ts-ignore
import App from './components/app.html'

new App({
    target: document.querySelector('#app'),
    hydrate: true,
})

const unregisterServiceWorker = async () => {
    const sw = navigator.serviceWorker
    if (!sw) return

    if (sw.controller) {
        sw.controller.postMessage('cleanup')
    }

    const workers = await sw.getRegistrations()
    workers.map((worker) => worker.unregister())
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
