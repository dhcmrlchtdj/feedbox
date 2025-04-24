import { hydrate } from "preact"
import { jsx } from "preact/jsx-runtime"
import "spectre.css"
import { App } from "./components/app.tsx"
import { initState } from "./shared/state.ts"
import { registerServiceWorker } from "./sw.ts"

initState()
hydrate(jsx(App, {}), document.querySelector("#app")!)
registerServiceWorker()
