import { useSignal, type Signal } from "@preact/signals"
import { useCallback } from "preact/hooks"
import { formatDate } from "../shared/helper"
import * as http from "../shared/http"
import { usePresenceList, type PresenceStatus } from "../shared/presence"
import {
	createFeedsSetter,
	feeds,
	notificationAdd,
	type Feed,
} from "../shared/state"

const formatUpdated = (date: string) => {
	if (!date) return "never"
	return formatDate(new Date(date))
}

const handleRemove = (feed: Feed, loading: Signal<boolean>) => {
	if (loading.value === true) {
		window.alert("processing")
		return
	}
	const c = window.confirm(`remove "${feed.url}"`)
	if (!c) return

	loading.value = true

	const setFeeds = createFeedsSetter()
	http.del<Feed[]>("/api/v1/feeds/remove", { feedID: feed.id })
		.then((resp) => setFeeds(resp))
		.then(() => (loading.value = false))
		.then(() => notificationAdd("removed"))
		.catch((err: Error) => {
			window.alert(err.message)
			location.reload()
		})
}

const Item = (props: { feed: Feed; status: PresenceStatus }) => {
	const loading = useSignal(false)
	const handleClick = useCallback(
		() => handleRemove(props.feed, loading),
		[props.feed, loading],
	)
	return (
		<article
			class={`feed-item feed-item--motion feed-item--${props.status}`}
		>
			<div class="feed-main">
				<div class="feed-title">
					<a
						target="_blank"
						rel="noopener noreferrer"
						href={props.feed.url}
					>
						{props.feed.url}
					</a>
				</div>
				<div class="feed-meta">
					<div>Updated {formatUpdated(props.feed.updated)}</div>
					{props.feed.err && (
						<div class="feed-error">
							Error {formatUpdated(props.feed.errAt!)} —{" "}
							{props.feed.err}
						</div>
					)}
				</div>
			</div>
			<button
				type="button"
				class="button button-remove"
				onClick={handleClick}
				disabled={loading.value}
			>
				{loading.value ? "Removing…" : "Remove"}
			</button>
		</article>
	)
}

export const List = () => {
	const xs = usePresenceList(feeds.value, (x) => x.id, 300, 300)
	return (
		<section
			class="feed-list"
			aria-label="Your feeds"
		>
			{xs.map((x) => (
				<Item
					feed={x.item}
					status={x.status}
					key={x.key}
				/>
			))}
			{xs.length === 0 && (
				<p class="feed-meta">
					No feeds yet. Add one above to get started.
				</p>
			)}
		</section>
	)
}
