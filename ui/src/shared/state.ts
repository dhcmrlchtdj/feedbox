import { signal } from "@preact/signals"
import { versionGuarder } from "./helper"

///

export type User = {
	id: number
	platform: "github"
	pid: string
	addition: { email: string }
}
export const email = signal<string>("")

///

export type Feed = {
	id: number
	updated: string
	url: string
}
export const feeds = signal<Feed[]>([])

export const createFeedsSetter = versionGuarder(
	(f: Feed[]) => (feeds.value = f),
)

///

export type Message = { key: number; msg: string }
export const notification = signal<Message[]>([])

let count = 0
export const newNotification = (msg: string) => {
	const key = count++
	notification.value = [...notification.peek(), { msg, key }]
	setTimeout(() => {
		notification.value = notification.peek().filter((x) => x.key !== key)
	}, 5 * 1000)
}
