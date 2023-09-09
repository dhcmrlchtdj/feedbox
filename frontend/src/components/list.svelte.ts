export { SvelteComponent as default } from "svelte"

export const $$template = `
{#each $feeds as feed (feed.id)}
<div
	class="column col-12"
	transition:slide
>
	<div class="tile">
		<div class="tile-content">
			<div class="tile-title text-break">
				<a
					target="_blank"
					rel="noopener noreferrer"
					href="{feed.url}"
				>
					{feed.url}
				</a>
			</div>
			<div class="tile-subtitle text-gray">
				<span>updated @ {formatDate(feed.updated)}</span>
			</div>
		</div>
		<div class="tile-action">
			<div>
				<button
					type="button"
					class="btn btn-error"
					class:loading="{loading[feed.id]}"
					class:disabled="{loading[feed.id]}"
					on:click="{remove(feed)}"
				>
					remove
				</button>
			</div>
		</div>
	</div>
	<div class="divider"></div>
</div>
{/each}
`

import { slide } from "svelte/transition"
import {
	feeds,
	createFeedsSetter,
	newNotification,
	type Feed,
} from "../state.js"
import * as agent from "../utils/agent.js"
import { format } from "../utils/format-date.js"

let loading: Record<string, boolean> = {}

const formatDate = (date: string) => {
	if (!date) return "never"
	return format(new Date(date))
}

const remove = (feed: Feed) => () => {
	if (loading[feed.id] === true) {
		window.alert("processing")
		return
	}
	const c = window.confirm(`remove "${feed.url}"`)
	if (!c) return

	loading = { ...loading, [feed.id]: true }

	const setFeeds = createFeedsSetter()
	agent
		.del<Feed[]>("/api/v1/feeds/remove", { feedID: feed.id })
		.then((resp) => setFeeds(resp))
		.then(() => (loading = { ...loading, [feed.id]: false }))
		.then(() => newNotification("removed"))
		.catch((err: Error) => {
			window.alert(err.message)
			location.reload()
		})
}
