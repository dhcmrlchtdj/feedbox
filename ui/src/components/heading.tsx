import { genClass } from "../shared/helper"
import { email } from "../shared/state"

const logout = () => {
	const sw = navigator.serviceWorker
	if (sw && sw.controller) {
		sw.controller.postMessage("logout")
	}
}

export const Heading = (props: { loaded: boolean }) => {
	return (
		<>
			<div class="column col-12">
				<h1 class="d-inline-block mb-0">FeedBox</h1>
				<span>&nbsp;</span>
				<span
					class={genClass("loading d-inline-block", [
						props.loaded,
						"d-invisible",
					])}
					style={{
						width: "0.8rem",
						"vertical-align": "text-top",
					}}
				></span>
				<span>&nbsp;</span>
				<span>{email}</span>
				<span>&nbsp;</span>
				<a
					href="/api/v1/feeds/export"
					target="_blank"
				>
					export
				</a>
				<span>&nbsp;</span>
				<a
					href="/api/logout"
					onClick={logout}
				>
					logout
				</a>
			</div>
			<div class="column col-12">
				<div class="divider"></div>
			</div>
		</>
	)
}
