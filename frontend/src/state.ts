import { createStore } from 'solid-js/store'

export type Feed = {
    id: number
    updated: string
    url: string
}

export type Notify = {
    key: number
    msg: string
}

export const [state, setState] = createStore({
    email: '',
    initialized: false,
    feeds: [] as Feed[],
    notify: [] as Notify[],
})

let notifyCount = 0
export const newNotify = (msg: string) => {
    const key = notifyCount++
    setState('notify', (prev) => [...prev, { msg, key }])
    setTimeout(() => {
        setState('notify', (prev) => prev.filter((x) => x.key !== key))
    }, 5 * 1000)
}
