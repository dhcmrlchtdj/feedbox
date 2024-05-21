import { hydrate, render } from "preact"
import { jsx } from "preact/jsx-runtime"
import "spectre.css"
import { App } from "./components/app.tsx"
import { initState } from "./shared/state.ts"

initState()
hydrate(jsx(App, {}), document.querySelector("#app")!)
