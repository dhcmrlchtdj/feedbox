import { render } from "inferno"
import "spectre.css"
import { MyComponent } from "./components/app"
import style from "./style.module.css"

const container = document.querySelector("#app")

render(
	<MyComponent
		name="Inferno"
		age={2}
	/>,
	container,
)
