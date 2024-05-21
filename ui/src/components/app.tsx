import { signal } from "@preact/signals"
import { sleep } from "../shared/helper.ts"
import * as http from "../shared/http"
import { email, feeds, type Feed, type User } from "../shared/state.ts"
import { Add } from "./add.tsx"
import { Auth } from "./auth.tsx"
import { Heading } from "./heading.tsx"
import { List } from "./list.tsx"
import { Notification } from "./notification.tsx"
import {useEffect} from "preact/hooks"

const initialized = signal(false)
const error = signal("")

const initOnce = () => {
	// keep the loading animation
	const delayAnimation = sleep(1000)
	Promise.all([
		http.get<User>("/api/v1/user"),
		http.get<Feed[]>("/api/v1/feeds"),
	])
		.then(async ([user, resp]) => {
			email.value = user.addition.email
			feeds.value = resp
			await delayAnimation
			initialized.value = true
		})
		.catch(async (err: Error) => {
			await delayAnimation
			initialized.value = true
			error.value = err.message
		})
}

export const App = () => {
	useEffect(initOnce, [])
	if (initialized.value) {
		if (error.value) {
			return (
				<div class="container grid-sm">
					<Auth err={error.value} />
				</div>
			)
		} else {
			return (
				<div class="container grid-sm">
					<div class="columns">
						<Heading initialized={true} />
						<Add />
						<List />
					</div>
					<Notification />
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
