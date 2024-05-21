import { signal } from "@preact/signals"
import { sleep, versionGuarder } from "./helper"
import * as http from "./http"

///

declare global {
	interface Window {
		__STATE__: {
			email: string
			feeds: Feed[]
		}
	}
}
const prevState = self.__STATE__ || {}

export const hydrated = !!self.__STATE__
export const loaded = signal(false)
export const loadingError = signal("")
export const email = signal(prevState.email || "")
export const feeds = signal(prevState.feeds || [])

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
			loaded.value = true
		})
		.catch(async (err: Error) => {
			if (hydrated) {
				window.alert(err.message)
				location.reload()
			} else {
				await delayAnimation
				loadingError.value = err.message
			}
		})
}

///

export type User = {
	id: number
	platform: "github"
	pid: string
	addition: { email: string }
}

///

export type Feed = {
	id: number
	updated: string
	url: string
}

export const createFeedsSetter = versionGuarder(
	(f: Feed[]) => (feeds.value = f),
)

///

export type Message = { key: number; msg: string }
export const notification = signal<Message[]>([])

let count = 0
export const notificationAdd = (msg: string): number => {
	const key = count++
	notification.value = [...notification.value, { msg, key }]
	setTimeout(() => {
		notification.value = notification.value.filter((x) => x.key !== key)
	}, 5 * 1000)
	return key
}

export const notificationRemove = (key: number) => {
	notification.value = notification.value.filter((n) => n.key !== key)
}
