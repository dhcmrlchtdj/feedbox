const logout = () => {
	const sw = navigator.serviceWorker
	if (sw && sw.controller) {
		sw.controller.postMessage("logout")
	}
}

export const Heading = (props: { email: string; initialized: boolean }) => {
	const cls = "d-inline-block" + (props.initialized ? "d-invisible" : "")
	return (
		<>
			<div class="column col-12">
				<h1 class="d-inline-block mb-0">FeedBox</h1>
				<span
					class={cls}
					style={{
						width: "0.8rem",
						"vertical-align": "text-top",
					}}
				></span>
				<span>{props.email}</span>
				<a
					href="/api/v1/feeds/export"
					target="_blank"
				>
					export
				</a>
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
