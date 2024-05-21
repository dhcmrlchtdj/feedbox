import { signal } from "@preact/signals"
import { genClass } from "../shared/helper"
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

	if (url.value === "") return
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
		<>
			<div class="column col-12">
				<form
					class="input-group"
					onSubmit={handleSubmit}
				>
					<input
						class="form-input"
						type="text"
						placeholder="feed url"
						value={url}
						onInput={handleInput}
					/>
					<button
						type="submit"
						class={genClass("btn btn-primary input-group-btn", [
							loading.value,
							"loading disabled",
						])}
						disabled={loading}
					>
						add
					</button>
				</form>
			</div>
			<div class="column col-12">
				<div class="divider"></div>
			</div>
		</>
	)
}
