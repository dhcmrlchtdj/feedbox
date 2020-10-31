import { writable } from 'svelte/store'

export const email = writable('')

export const feeds = writable([])

export const notify = writable([])
export const newNotify = (msg) => {
    const key = Date.now()
    notify.update((prev) => [...prev, { msg, key }])
    setTimeout(() => {
        notify.update((prev) => [...prev.filter((x) => x.key !== key)])
    }, 5 * 1000)
}
