import runtime from "serviceworker-webpack-plugin/lib/runtime";
import "spectre.css";
import App from "./app.svelte";

if ("serviceWorker" in navigator) {
    runtime.register().then(reg => reg.update());
}

const app = new App({
    target: document.querySelector("#app"),
});

export default app;
