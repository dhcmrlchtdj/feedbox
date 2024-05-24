import { signal } from "@preact/signals"
import {
	email,
	feeds,
	hydrated,
	loaded,
	loadingError,
	type Feed,
	type User,
} from "../shared/state.ts"
import { Add } from "./add.tsx"
import { Auth } from "./auth.tsx"
import { Heading } from "./heading.tsx"
import { List } from "./list.tsx"
import { Notification } from "./notification.tsx"

export const App = () => {
	if (loadingError.value) {
		return (
			<div class="container grid-sm">
				<Auth err={loadingError.value} />
			</div>
		)
	} else if (hydrated || loaded.value) {
		return (
			<div class="container grid-sm">
				<div class="columns">
					<Heading
						email={email.value}
						loaded={loaded.value}
					/>
					<Add />
					<List />
				</div>
				<Notification />
			</div>
		)
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
