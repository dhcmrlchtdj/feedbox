export const Auth = (props: { err: string }) => {
	return (
		<div>
			<p class="auth-message">{props.err ?? "Unable to load FeedBox."}</p>
			<a
				class="button button-primary"
				href="/api/connect/github"
			>
				Log in with GitHub
			</a>
		</div>
	)
}
