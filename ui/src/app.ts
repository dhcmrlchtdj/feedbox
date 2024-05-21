import { h, hydrate, render } from "preact"
import "spectre.css"
import { App } from "./components/app.tsx"

hydrate(h(App, null), document.querySelector("#app")!)
