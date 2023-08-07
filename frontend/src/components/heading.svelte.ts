export { SvelteComponent as default } from "svelte"

export const $$style = `
.loading {
	width: 0.8rem;
	vertical-align: text-top;
}
`

export const $$template = `
<div class="column col-12">
	<h1 class="d-inline-block mb-0">FeedBox</h1>
	<span
		class="loading d-inline-block"
		class:d-invisible="{$initialized}"
	></span>
	<span>{$email}</span>
	<a
		href="/api/v1/feeds/export"
		target="_blank"
	>
		export
	</a>
	<a
		href="/api/logout"
		on:click="{logout}"
	>
		logout
	</a>
</div>
<div class="column col-12"><div class="divider"></div></div>
`

import { email, initialized } from "../state.js"

const logout = () => {
	const sw = navigator.serviceWorker
	if (sw && sw.controller) {
		sw.controller.postMessage("logout")
	}
}
