import "purecss";
import App from "./components/app.svelte";

const app = new App({
    target: document.body,
    data: {
        name: "w",
    },
});

export default app;
