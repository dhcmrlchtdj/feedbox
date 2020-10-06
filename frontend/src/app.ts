/// <reference lib="dom" />

// @ts-ignore
import App from './components/app.html'

new App({
    // @ts-ignore
    target: document.querySelector('#app'),
    hydrate: true,
})

if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/sw.js')
    // navigator.serviceWorker.getRegistrations().then(workers => workers.map(worker => worker.unregister()))
}
