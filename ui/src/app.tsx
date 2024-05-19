import { render } from "inferno"
import "spectre.css"
import { MyComponent } from "./components/app"
import * as style from "./style.module.css"

const container = document.querySelector("#app")

render(
	<MyComponent
		name={style.a}
		age={2}
	/>,
	container,
)
