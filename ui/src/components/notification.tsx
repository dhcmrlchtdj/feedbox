import { notification, notificationRemove, type Message } from "../shared/state"

const Item = (props: { msg: Message }) => {
	const handleClick = () => notificationRemove(props.msg.key)
	return (
		<div class={`toast toast-success mb-2`}>
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
		<div style={style}>
			{notification.value.map((msg) => (
				<Item
					key={msg.key}
					msg={msg}
				/>
			))}
		</div>
	)
}
