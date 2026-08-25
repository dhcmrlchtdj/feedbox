const logout = () => {
	const sw = navigator.serviceWorker
	if (sw && sw.controller) {
		sw.controller.postMessage("logout")
	}
}

export const Heading = (props: { email: string; loaded: boolean }) => {
	return (
		<header class="site-header">
			<div class="brand-row">
				<div class="brand-lockup">
					<h1>FeedBox</h1>
					<p class="account-line">
						<span
							class={`sync-status sync-status--${props.loaded ? "synced" : "syncing"}`}
							aria-live="polite"
						>
							{props.loaded ? "synced" : "syncing"}
						</span>
						<span>{props.email}</span>
					</p>
				</div>
				<nav
					class="header-actions"
					aria-label="Account actions"
				>
					<a
						aria-label="Export feeds (opens in a new tab)"
						href="/api/v1/feeds/export"
						target="_blank"
					>
						Export
					</a>
					<a
						href="/api/logout"
						onClick={logout}
					>
						Log out
					</a>
				</nav>
			</div>
		</header>
	)
}
