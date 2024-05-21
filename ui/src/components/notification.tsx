import { useCallback } from "preact/hooks"
import { notification, notificationRemove, type Message } from "../shared/state"
import * as style from "./style.module.css"

const Item = (props: { msg: Message }) => {
	const handleClick = useCallback(
		() => notificationRemove(props.msg.key),
		[props.msg],
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

export const Notification = () => {
	return (
		<div class={style.notificationContainer}>
			{notification.value.map((msg) => (
				<Item
					key={msg.key}
					msg={msg}
				/>
			))}
		</div>
	)
}
