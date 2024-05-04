import { writable, type Writable } from "svelte/store"
import { dataGuarder } from "./utils/data-guarder.js"

///

export type User = {
	id: number
	platform: "github"
	pid: string
	addition: { email: string }
}

export const email = writable("")

///

export type Feed = {
	id: number
	updated: string
	url: string
}
export const feeds: Writable<Feed[]> = writable([])
export const createFeedsSetter = dataGuarder((f: Feed[]) => feeds.set(f))

///

export const notification: Writable<{ key: number; msg: string }[]> = writable(
	[],
)
let count = 0
export const newNotification = (msg: string) => {
	const key = count++
	notification.update((prev) => [...prev, { msg, key }])
	setTimeout(() => {
		notification.update((prev) => prev.filter((x) => x.key !== key))
	}, 5 * 1000)
}

///

export const initialized = writable(false)
