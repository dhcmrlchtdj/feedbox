import App from './components/app.html'

new App({
    target: document.querySelector('#app'),
    hydrate: true,
})

if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/sw.js')
}