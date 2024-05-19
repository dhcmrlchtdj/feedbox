import { hydrate } from "inferno-hydrate"
import "spectre.css"
import { App } from "./components/app"

hydrate(<App />, document.querySelector("#app")!)
