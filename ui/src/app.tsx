import { render } from "inferno"
import { MyComponent } from "./components/app"

const container = document.querySelector("#app")

render(
	<MyComponent
		name="Inferno"
		age={2}
	/>,
	container,
)
