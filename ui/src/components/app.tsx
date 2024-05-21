import { signal } from "@preact/signals"
import {
	email,
	feeds,
	hasCache,
	initError,
	loaded,
	type Feed,
	type User,
} from "../shared/state.ts"
import { Add } from "./add.tsx"
import { Auth } from "./auth.tsx"
import { Heading } from "./heading.tsx"
import { List } from "./list.tsx"
import { Notification } from "./notification.tsx"

export const App = () => {
	if (initError.value) {
		return (
			<div class="container grid-sm">
				<Auth err={initError.value} />
			</div>
		)
	} else if (loaded.value || hasCache.value) {
		return (
			<div class="container grid-sm">
				<div class="columns">
					<Heading loaded={loaded.value} />
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
