export { SvelteComponent as default } from "svelte"

export const $$template = `
<div class="columns">
	<div class="column col-12 mt-2">
		<div class="toast toast-error">
			<span>{err}</span>
		</div>
	</div>
	<div class="column col-12"><div class="divider"></div></div>

	<div class="column col-12 text-center">
		<a
			class="btn btn-lg btn-secondary"
			href="/api/connect/github"
		>
			Login with GitHub
		</a>
	</div>
</div>
`

let { err = "unknown error" } = $props()
