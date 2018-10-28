import "purecss";

import App from "./components/app.svelte";
import store from "./store.js";

const app = new App({
    target: document.querySelector("#app"),
    store,
});

export default app;
