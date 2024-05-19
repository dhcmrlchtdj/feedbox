import { atom } from "nanostores"
import { versionGuarder } from "./shared"

///

export type User = {
	id: number
	platform: "github"
	pid: string
	addition: { email: string }
}

export const email = atom<string>("")

///

export type Feed = {
	id: number
	updated: string
	url: string
}
export const feeds = atom<Feed[]>([])

export const createFeedsSetter = versionGuarder(feeds.set)

///

export type Message = { key: number; msg: string }
export const notification = atom<Message[]>([])

let count = 0
export const newNotification = (msg: string) => {
	const key = count++
	notification.set([...notification.get(), { msg, key }])
	setTimeout(() => {
		notification.set(notification.get().filter((x) => x.key !== key))
	}, 5 * 1000)
}

///

export const initialized = atom<boolean>(false)
