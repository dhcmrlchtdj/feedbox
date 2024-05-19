import { hydrate } from "inferno-hydrate"
import "spectre.css"
import { App } from "./components/app"
import "./inferno.css"

hydrate(<App />, document.querySelector("#app")!)
