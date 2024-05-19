import { genClass } from "../global/shared"
import { email } from "../global/state"

const logout = () => {
	const sw = navigator.serviceWorker
	if (sw && sw.controller) {
		sw.controller.postMessage("logout")
	}
}

export const Heading = (props: { initialized: boolean }) => {
	return (
		<>
			<div class="column col-12">
				<h1 class="d-inline-block mb-0">FeedBox</h1>
				<span
					class={genClass("d-inline-block", [
						props.initialized,
						"d-invisible",
					])}
					style={{
						width: "0.8rem",
						"vertical-align": "text-top",
					}}
				></span>
				<span>{email.get()}</span>
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
