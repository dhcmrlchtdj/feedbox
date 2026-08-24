import { signal } from "@preact/signals"
import * as http from "../shared/http"
import { createFeedsSetter, notificationAdd, type Feed } from "../shared/state"

const loading = signal(false)
const url = signal("")

const handleSubmit = (event: Event) => {
	event.preventDefault()

	if (loading.value === true) {
		window.alert("processing")
		return
	}

	if (!URL.canParse(url.value)) {
		window.alert("Invalid URL")
		return
	}

	loading.value = true

	const setFeeds = createFeedsSetter()
	http.put<Feed[]>("/api/v1/feeds/add", { url: url.value })
		.then((resp) => setFeeds(resp))
		.then(() => notificationAdd("added"))
		.catch((err: Error) => {
			window.alert(err.message)
			location.reload()
		})
		.then(() => {
			url.value = ""
			loading.value = false
		})
}

const handleInput = (event: Event) => {
	url.value = (event.target as HTMLInputElement).value
}

export const Add = () => {
	return (
		<section class="add-section">
			<form
				class="add-form"
				onSubmit={handleSubmit}
			>
				<input
					aria-label="Feed URL"
					class="feed-input"
					id="feed-url"
					type="url"
					placeholder="Paste a feed URL"
					value={url}
					onInput={handleInput}
				/>
				<button
					type="submit"
					class="button button-primary"
					disabled={loading.value}
				>
					{loading.value ? "Adding…" : "Add feed"}
				</button>
			</form>
		</section>
	)
}
