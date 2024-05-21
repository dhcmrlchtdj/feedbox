import { signal } from "@preact/signals"
import { useCallback } from "preact/hooks"
import { formatDate, genClass } from "../shared/helper"
import * as http from "../shared/http"
import {
	createFeedsSetter,
	feeds,
	newNotification,
	type Feed,
} from "../shared/state"

const loading = signal<Record<string, boolean>>({})

const formatUpdated = (date: string) => {
	if (!date) return "never"
	return formatDate(new Date(date))
}

const handleRemove = (feed: Feed) => {
	if (loading.value[feed.id] === true) {
		window.alert("processing")
		return
	}
	const c = window.confirm(`remove "${feed.url}"`)
	if (!c) return

	loading.value = { ...loading.value, [feed.id]: true }

	const setFeeds = createFeedsSetter()
	http.del<Feed[]>("/api/v1/feeds/remove", { feedID: feed.id })
		.then((resp) => setFeeds(resp))
		.then(() => (loading.value = { ...loading.value, [feed.id]: false }))
		.then(() => newNotification("removed"))
		.catch((err: Error) => {
			window.alert(err.message)
			location.reload()
		})
}

const Item = (props: { feed: Feed }) => {
	const handleClick = useCallback(
		() => handleRemove(props.feed),
		[props.feed],
	)
	return (
		<div class="column col-12">
			<div class="tile">
				<div class="tile-content">
					<div class="tile-title text-break">
						<a
							target="_blank"
							rel="noopener noreferrer"
							href={props.feed.url}
						>
							{props.feed.url}
						</a>
					</div>
					<div class="tile-subtitle text-gray">
						<span>
							updated @ {formatUpdated(props.feed.updated)}
						</span>
					</div>
				</div>
				<div class="tile-action">
					<div>
						<button
							type="button"
							class={genClass("btn btn-error", [
								loading.value[props.feed.id],
								"loading disabled",
							])}
							onClick={handleClick}
						>
							remove
						</button>
					</div>
				</div>
			</div>
			<div class="divider"></div>
		</div>
	)
}

export const List = () => {
	return (
		<>
			{feeds.value.map((feed) => (
				<Item
					key={feed.id}
					feed={feed}
				/>
			))}
		</>
	)
}
