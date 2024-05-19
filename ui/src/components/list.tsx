import { Component, linkEvent } from "inferno"
import { componentDidAppear, componentWillDisappear } from "inferno-animation"
import * as http from "../global/http"
import { formatDate, genClass } from "../global/shared"
import {
	createFeedsSetter,
	feeds,
	newNotification,
	type Feed,
} from "../global/state"

const formatUpdated = (date: string) => {
	if (!date) return "never"
	return formatDate(new Date(date))
}

const Item = (props: {
	feed: Feed
	loading: boolean | undefined
	handleRemove: (feed: Feed) => void
}) => {
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
								props.loading,
								"loading disabled",
							])}
							onClick={linkEvent(props.feed, props.handleRemove)}
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

export class List extends Component {
	override state: Readonly<{
		loading: Record<string, boolean>
		feeds: Feed[]
	}>
	private cleanup: (() => void)[]

	constructor() {
		super()
		this.state = {
			loading: {},
			feeds: [],
		}
		this.cleanup = []
	}

	override componentWillMount() {
		const unsub = feeds.subscribe((val) => {
			this.setState({ feeds: val })
		})
		this.cleanup.push(unsub)
	}
	override componentWillUnmount() {
		this.cleanup.forEach((fn) => fn())
	}

	handleRemove = (feed: Feed) => {
		if (this.state.loading[feed.id] === true) {
			window.alert("processing")
			return
		}
		const c = window.confirm(`remove "${feed.url}"`)
		if (!c) return

		this.setState({
			loading: { ...this.state.loading, [feed.id]: true },
		})

		const setFeeds = createFeedsSetter()
		http.del<Feed[]>("/api/v1/feeds/remove", { feedID: feed.id })
			.then((resp) => setFeeds(resp))
			.then(() =>
				this.setState({
					loading: { ...this.state.loading, [feed.id]: false },
				}),
			)
			.then(() => newNotification("removed"))
			.catch((err: Error) => {
				window.alert(err.message)
				location.reload()
			})
	}

	override render() {
		return this.state.feeds.map((feed) => (
			<Item
				onComponentDidAppear={componentDidAppear}
				onComponentWillDisappear={componentWillDisappear}
				feed={feed}
				loading={this.state.loading[feed.id]}
				handleRemove={this.handleRemove}
			></Item>
		))
	}
}
