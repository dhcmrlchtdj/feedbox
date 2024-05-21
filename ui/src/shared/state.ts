import { signal } from "@preact/signals"
import { sleep, versionGuarder } from "./helper"
import * as http from "./http"

///

export const initialized = signal(false)
export const initError = signal("")

export const initState = () => {
	// keep the loading animation
	const delayAnimation = sleep(1000)
	Promise.all([
		http.get<User>("/api/v1/user"),
		http.get<Feed[]>("/api/v1/feeds"),
	])
		.then(async ([user, resp]) => {
			email.value = user.addition.email
			feeds.value = resp
			await delayAnimation
			initialized.value = true
		})
		.catch(async (err: Error) => {
			await delayAnimation
			initialized.value = true
			initError.value = err.message
		})
}

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
