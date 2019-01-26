import App from "./app.html";

new App({
    target: document.querySelector("#app"),
    hydrate: true,
});

if (navigator.serviceWorker) {
    // navigator.serviceWorker.register("/sw.js").then(reg => reg.update());
}
