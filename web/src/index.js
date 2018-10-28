import "spectre.css";
import App from "./components/app.svelte";

const app = new App({
    target: document.body,
    data: {
        name: "world",
    },
});

export default app;
