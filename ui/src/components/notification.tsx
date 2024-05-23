import { useRef } from "preact/hooks"
import { notification, notificationRemove, type Message } from "../shared/state"
import "./style.css"
import { Transition, TransitionGroup, type TransitionProps } from "./transition"

const Item = (props: { msg: Message } & TransitionProps) => {
	const handleClick = () => notificationRemove(props.msg.key)

	const el = useRef(null)
	const handleLeave = (e: Event) => {
		if (el.current === e.target) props.onEnd?.()
	}
	const ani = props.state === "leave" ? "fly fly-leave" : "fly"
	return (
		<div
			ref={el}
			class={`toast toast-success mb-2 ${ani}`}
			onTransitionEnd={handleLeave}
		>
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
			<TransitionGroup>
				{notification.value.map((msg) => (
					<Transition key={msg.key}>
						<Item
							key={msg.key}
							msg={msg}
						/>
					</Transition>
				))}
			</TransitionGroup>
		</div>
	)
}
