// @ts-ignore
import App from './components/app.html'

new App({
    target: document.querySelector('#app'),
    hydrate: true,
})

if (navigator.serviceWorker) {
    const query = new URLSearchParams(location.search)
    const sw = query.get('sw')
    if (sw === '0') {
        navigator.serviceWorker
            .getRegistrations()
            .then((workers) => workers.map((worker) => worker.unregister()))
    } else {
        navigator.serviceWorker.register('/sw.js')
    }
}
