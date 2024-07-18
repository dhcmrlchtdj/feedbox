import { Signal, useSignal } from "@preact/signals"
import { useRef } from "preact/hooks"
import { formatDate } from "../shared/helper"
import * as http from "../shared/http"
import {
	createFeedsSetter,
	feeds,
	notificationAdd,
	type Feed,
} from "../shared/state"
import "./style.css"
import { Transition, TransitionGroup, type TransitionProps } from "./transition"

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

const Item = (props: { feed: Feed } & TransitionProps) => {
	const loading = useSignal(false)
	const handleClick = () => handleRemove(props.feed, loading)
	const el = useRef(null)
	const handleLeave = (e: Event) => {
		if (el.current === e.target) props.onEnd?.()
	}
	const ani = props.state === "leave" ? "slide slide-leave" : "slide"
	return (
		<div
			ref={el}
			class={`column col-12 ${ani}`}
			onTransitionEnd={handleLeave}
		>
			<div style="overflow:hidden;">
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
								class={`btn btn-error ${loading.value ? "loading disabled" : ""}`}
								onClick={handleClick}
							>
								remove
							</button>
						</div>
					</div>
				</div>
				<div class="divider"></div>
			</div>
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
	//     <TransitionGroup>
	//         {feeds.value.map((feed) => (
	//             <Transition key={feed.id}>
	//                 <Item
	//                     key={feed.id}
	//                     feed={feed}
	//                 />
	//             </Transition>
	//         ))}
	//     </TransitionGroup>
	// )
}
