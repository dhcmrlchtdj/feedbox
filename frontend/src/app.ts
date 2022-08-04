import { hydrate } from 'solid-js/web'
import { App } from './components/app'
import { Feed } from './state'

// self -> Window | ServiceWorkerGlobalScope
const pageState: { email?: string; feeds?: Feed[] } =
    (self as any).__STATE__ ?? {}
hydrate(() => App(pageState), document.querySelector('#app')!)

if (navigator.serviceWorker) {
    // navigator.serviceWorker.register('/sw.js')
    // navigator.serviceWorker
    //     .getRegistrations()
    //     .then((workers) => workers.map((worker) => worker.unregister()))
}
