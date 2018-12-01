import runtime from "serviceworker-webpack-plugin/lib/runtime";
import "spectre.css";
import App from "./app.svelte";

new App({ target: document.querySelector("#app") });

if (navigator.serviceWorker) {
    runtime.register().then(reg => reg.update());
}
