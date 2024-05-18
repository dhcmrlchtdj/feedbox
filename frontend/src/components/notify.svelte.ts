export { SvelteComponent as default } from "svelte"

export const $$style = `
.notification {
	position: fixed;
	width: 10em;
	right: 0.4rem;
	top: 0.4rem;
	z-index: 10;
	contain: content;
}
`

export const $$template = `
<div class="notification">
	{#each $notification as n, i (n.key)}
	<div
		class="toast toast-success mb-2"
		transition:fly="{{x:100}}"
	>
		<button
			class="btn btn-clear float-right"
			onclick="{() => remove(i)}"
		></button>
		{n.msg}
	</div>
	{/each}
</div>
`

import { fly } from "svelte/transition"
import { notification } from "../state.js"

const remove = (idx: number) => {
	notification.update((ns) => {
		ns.splice(idx, 1)
		return [...ns]
	})
}
