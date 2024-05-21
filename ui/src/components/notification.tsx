import { useCallback } from "preact/hooks"
import { notification } from "../shared/state"

const remove = (idx: number) => {
	notification.value = notification.value.filter((_, i) => i !== idx)
}

const Item = (props: { idx: number; msg: string }) => {
	const handleClick = useCallback(() => remove(props.idx), [props.idx])
	return (
		<div class="toast toast-success mb-2">
			<button
				class="btn btn-clear float-right"
				onClick={handleClick}
			></button>
			{props.msg}
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
			{notification.value.map((msg, idx) => (
				<Item
					key={msg.key}
					msg={msg.msg}
					idx={idx}
				/>
			))}
		</div>
	)
}
