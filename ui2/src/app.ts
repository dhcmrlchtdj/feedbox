import { hydrate } from "preact"
import { App } from "./components/app.tsx"

hydrate(App, document.querySelector("#app")!)
