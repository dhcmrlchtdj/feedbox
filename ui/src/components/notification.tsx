import { useCallback } from "preact/hooks"
import { notification, notificationRemove, type Message } from "../shared/state"
import { Transition, TransitionGroup } from "./transition"

const Item = (props: { msg: Message }) => {
	const handleClick = useCallback(
		() => notificationRemove(props.msg.key),
		[props.msg.key],
	)
	return (
		<div class="toast toast-success mb-2">
			<button
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
	return (
		<TransitionGroup style={style}>
			{notification.value.map((msg) => (
				<Transition key={msg.key}>
					<Item msg={msg} />
				</Transition>
			))}
		</TransitionGroup>
	)
}
