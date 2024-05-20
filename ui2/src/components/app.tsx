import { signal } from "@preact/signals"
import { Auth } from "./auth.tsx"

const initialized = signal(false)
const err = signal("")

export const App = () => {
	if (initialized.value) {
		if (err.value) {
			return (
				<div class="container grid-sm">
					<Auth err={err.value}></Auth>
				</div>
			)
		} else {
			return (
				<div class="container grid-sm">
					<div class="columns">
						<Heading initialized={true}></Heading>
						<Add></Add>
						<List></List>
					</div>
					<Notification></Notification>
				</div>
			)
		}
	} else {
		return (
			<div class="container grid-sm">
				<div class="columns">
					<div class="column col-12">
						<div class="loading loading-lg"></div>
					</div>
				</div>
			</div>
		)
	}
}
