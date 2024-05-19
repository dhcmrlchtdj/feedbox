import { Component, linkEvent } from "inferno"
import { notification, type Message } from "../global/state"

const remove = (idx: number) => {
	const prev = notification.get()
	const next = prev.splice(idx, 1)
	notification.set(next)
}

const Item = (props: { idx: number; msg: string }) => {
	return (
		<div class="toast toast-success mb-2">
			<button
				class="btn btn-clear float-right"
				onClick={linkEvent(props.idx, remove)}
			></button>
			{props.msg}
		</div>
	)
}

export class Notification extends Component {
	override state: Readonly<{ notification: Message[] }>
	private cleanup: (() => void)[]
	constructor() {
		super()
		this.state = {
			notification: [],
		}
		this.cleanup = []
	}
	override componentWillMount() {
		const unsub = notification.subscribe((val) => {
			this.setState({ notification: val })
		})
		this.cleanup.push(unsub)
	}
	override componentWillUnmount() {
		this.cleanup.forEach(fn => fn())
	}
	override render() {
		return (
			<div
				style={{
					position: "fixed",
					width: "10em",
					right: "0.4rem",
					top: "0.4rem",
					"z-index": "10",
					contain: "content",
				}}
			>
				{this.state.notification.map((msg, idx) => (
					<Item
						msg={msg.msg}
						idx={idx}
					></Item>
				))}
			</div>
		)
	}
}
