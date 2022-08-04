import type { Component } from 'solid-js'
import { For, createSignal } from 'solid-js'
import { state, setState, Feed, newNotify } from '../state'
import { format } from '../utils/format-date'
import * as agent from '../utils/agent'

const formatDate = (date: string | number | Date) => {
    if (!date) return 'never'
    return format(new Date(date))
}

const ListItem: Component<Feed> = (props) => {
    const [loading, setLoading] = createSignal(false)

    const remove = async () => {
        if (loading() === true) {
            window.alert('processing')
            return
        }
        const c = window.confirm(`remove "${props.url}"`)
        if (!c) return

        setLoading(true)

        agent
            .del(`/api/v1/feeds/remove`, { feedID: props.id })
            .then((resp) => setState('feeds', resp))
            .then(() => newNotify('removed'))
            .catch((err) => {
                window.alert(err.message)
                location.reload()
            })
    }

    return (
        <div class="column col-12">
            <div class="tile">
                <div class="tile-content">
                    <div class="tile-title text-break">
                        <a target="_blank" rel="noopener" href="{feed.url}">
                            {props.url}
                        </a>
                    </div>
                    <div class="tile-subtitle text-gray">
                        <span>updated @ {formatDate(props.updated)}</span>
                    </div>
                </div>
                <div class="tile-action">
                    <div>
                        <button
                            type="button"
                            class="btn btn-error"
                            classList={{
                                loading: loading(),
                                disabled: loading(),
                            }}
                            onClick={remove}
                        >
                            remove
                        </button>
                    </div>
                </div>
            </div>
            <div class="divider"></div>
        </div>
    )
}

export const List: Component = () => {
    return <For each={state.feeds}>{(feed) => <ListItem {...feed} />}</For>
}
