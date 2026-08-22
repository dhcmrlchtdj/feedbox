import { useCallback } from "preact/hooks"
import { Presence, usePresenceList } from "../shared/presence"
import { notification, notificationRemove, type Message } from "../shared/state"

const Item = (props: { msg: Message }) => {
	const handleClick = useCallback(
		() => notificationRemove(props.msg.key),
		[props.msg.key],
	)
	return (
		<div class={`toast toast-success mb-2`}>
			<button
				aria-label="Close"
				class="btn btn-clear float-right"
				onClick={handleClick}
			></button>
			{props.msg.msg}
		</div>
	)
}

const style = {
	position: "fixed",
	width: "10em",
	right: "0.4rem",
	top: "0.4rem",
	"z-index": "10",
	contain: "content",
}

export const Notification = () => {
	const xs = usePresenceList(notification.value, (x) => x.key, 100, 300)
	return (
		<div style={style}>
			{xs.map((x) => (
				<Presence
					key={x.key}
					status={x.status}
					style={`fade`}
				>
					<Item msg={x.item} />
				</Presence>
			))}
		</div>
	)
}
