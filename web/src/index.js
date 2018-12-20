import App from "./app.svelte";

new App({
    target: document.querySelector("#app"),
});

if (navigator.serviceWorker) {
    navigator.serviceWorker.register("/sw.js").then(reg => reg.update());
}
