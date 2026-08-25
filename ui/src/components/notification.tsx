import { useCallback } from "preact/hooks"
import { usePresenceList, type PresenceStatus } from "../shared/presence"
import { notification, notificationRemove, type Message } from "../shared/state"

const Item = (props: { msg: Message; status: PresenceStatus }) => {
	const handleClick = useCallback(
		() => notificationRemove(props.msg.key),
		[props.msg.key],
	)
	return (
		<output
			class={`notification notification-success toast-motion toast--${props.status}`}
		>
			<span>{props.msg.msg}</span>
			<button
				aria-label="Close notification"
				class="notification-close"
				onClick={handleClick}
				type="button"
			>
				X
			</button>
		</output>
	)
}

const getMessageKey = (x: Message) => x.key

export const Notification = () => {
	const xs = usePresenceList(notification.value, getMessageKey, 300, 300)
	return (
		<div class="notifications">
			{xs.map((x) => (
				<Item
					key={x.key}
					msg={x.item}
					status={x.status}
				/>
			))}
		</div>
	)
}
