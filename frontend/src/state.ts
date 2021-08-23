import { writable } from 'svelte/store'
import type { Writable } from 'svelte/store'

export const email = writable('')

type Feed = {
    id: number
    updated: string
    url: string
}
export const feeds: Writable<Feed[]> = writable([])

export const notify: Writable<{ key: number; msg: string }[]> = writable([])
export const newNotify = (msg: string) => {
    const key = Date.now()
    notify.update((prev) => [...prev, { msg, key }])
    setTimeout(() => {
        notify.update((prev) => [...prev.filter((x) => x.key !== key)])
    }, 5 * 1000)
}

export const initialized = writable(false)
