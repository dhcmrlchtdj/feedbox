export { SvelteComponent as default } from "svelte"

export const $$template = `
<div class="column col-12">
	<form
		class="input-group"
		onsubmit="{add}"
	>
		<input
			class="form-input"
			type="text"
			placeholder="feed url"
			bind:value="{url}"
		/>
		<button
			type="submit"
			class="btn btn-primary input-group-btn"
			class:loading="{loading}"
			class:disabled="{loading}"
			disabled="{loading}"
		>
			add
		</button>
	</form>
</div>
<div class="column col-12"><div class="divider"></div></div>
`

import {
	createFeedsSetter,
	feeds,
	newNotification,
	type Feed,
} from "../state.js"
import * as agent from "../utils/agent.js"

let loading = $state(false)
let url = $state("")

const add = (e: Event) => {
	e.preventDefault()

	if (loading === true) {
		window.alert("processing")
		return
	}
	if (url === "") return
	loading = true

	const setFeeds = createFeedsSetter()
	agent
		.put<Feed[]>("/api/v1/feeds/add", { url })
		.then((resp) => setFeeds(resp))
		.then(() => newNotification("added"))
		.catch((err: Error) => {
			window.alert(err.message)
			location.reload()
		})
		.then(() => {
			url = ""
			loading = false
		})
}
