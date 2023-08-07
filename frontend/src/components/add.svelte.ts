export { SvelteComponent as default } from "svelte"

export const $$template = `
<div class="column col-12">
	<form
		class="input-group"
		on:submit|preventDefault="{add}"
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

import { feeds, createFeedsSetter, newNotification } from "../state.js"
import * as agent from "../utils/agent.js"

let loading = false
let url = ""

const add = async () => {
	if (loading === true) {
		window.alert("processing")
		return
	}
	if (url === "") return
	loading = true

	const setFeeds = createFeedsSetter()
	agent
		.put("/api/v1/feeds/add", { url })
		.then((resp) => setFeeds(resp))
		.then(() => newNotification("added"))
		.catch((err) => {
			window.alert(err.message)
			location.reload()
		})
		.then(() => {
			url = ""
			loading = false
		})
}
