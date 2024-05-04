export { SvelteComponent as default } from "svelte"

export const $$template = `
<div class="container grid-sm">
	{#await loaded.promise}
	<div class="columns">
		<div class="column col-12">
			<div class="loading loading-lg"></div>
		</div>
	</div>
	{:then}
	<div class="columns">
		<Heading></Heading>
		<Add></Add>
		<List></List>
	</div>
	<Notify></Notify>
	{:catch err}
	<Auth {err}></Auth>
	{/await}
</div>
`

import Add from "./add.svelte.js"
import Auth from "./auth.svelte.js"
import Heading from "./heading.svelte.js"
import List from "./list.svelte.js"
import Notify from "./notify.svelte.js"

import { onMount } from "svelte"
import * as state from "../state.js"
import * as agent from "../utils/agent.js"
import { Deferred, sleep } from "../utils/deferred.js"

declare global {
	interface Window {
		__STATE__: {
			loaded: Deferred<boolean>
			email: string
			feeds: state.Feed[]
		}
	}
}

// self -> Window | ServiceWorkerGlobalScope
const workerState = self.__STATE__ || {}
export let loaded = workerState.loaded || new Deferred<boolean>()
export let email = workerState.email || ""
export let feeds = workerState.feeds || []

if (email) state.email.set(email)
if (feeds.length > 0) state.feeds.set(feeds)
onMount(() => {
	// keep the loading animation
	const delayAnimation = sleep(1000)
	Promise.all([
		agent.get<state.User>("/api/v1/user"),
		agent.get<state.Feed[]>("/api/v1/feeds"),
	])
		.then(async ([user, resp]) => {
			state.email.set(user.addition.email)
			state.feeds.set(resp)
			if (loaded.resolve) {
				// first time
				await delayAnimation
				state.initialized.set(true)
				loaded.resolve(true)
			} else {
				// rendered by ServiceWorker
				await delayAnimation
				state.initialized.set(true)
			}
		})
		.catch(async (err: Error) => {
			if (loaded.reject) {
				// first time
				await delayAnimation
				loaded.reject(err.message)
			} else {
				// rendered by ServiceWorker
				window.alert(err.message)
				location.reload()
			}
		})
})
