import type { Component } from 'solid-js'
import { createSignal } from 'solid-js'
import { setState, newNotify } from '../state'
import * as agent from '../utils/agent'

export const Add: Component = () => {
    const [loading, setLoading] = createSignal(false)
    const [url, setUrl] = createSignal('')

    const add = (evt: SubmitEvent) => {
        evt.preventDefault()

        if (loading() === true) {
            window.alert('processing')
            return
        }
        if (url() === '') return
        setLoading(true)

        agent
            .put(`/api/v1/feeds/add`, { url })
            .then((resp) => setState('feeds', resp))
            .then(() => newNotify('added'))
            .catch((err) => {
                window.alert(err.message)
                location.reload()
            })
            .then(() => {
                setUrl('')
                setLoading(false)
            })
    }

    return (
        <>
            <div class="column col-12">
                <form class="input-group" onSubmit={add}>
                    <input
                        class="form-input"
                        type="text"
                        placeholder="feed url"
                        value={url()}
                    />
                    <button
                        type="submit"
                        class="btn btn-primary input-group-btn"
                        classList={{ loading: loading(), disabled: loading() }}
                        disabled={loading()}
                    >
                        add
                    </button>
                </form>
            </div>
            <div class="column col-12">
                <div class="divider"></div>
            </div>
        </>
    )
}
