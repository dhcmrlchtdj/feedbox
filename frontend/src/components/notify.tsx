import type { Component } from 'solid-js'
import { For } from 'solid-js'
import { state, setState } from '../state'

const remove = (idx: number) => {
    setState('notify', (prev) => prev.filter((_, i) => i !== idx))
}

export const Notify: Component = () => {
    return (
        <div
            style="
                position: fixed;
                width: 10em;
                right: 0.4rem;
                top: 0.4rem;
                z-index: 10;
                contain: content;
            "
        >
            <For each={state.notify}>
                {(n, idx) => (
                    <div class="toast toast-success mb-2">
                        <button
                            class="btn btn-clear float-right"
                            onClick={() => remove(idx())}
                        ></button>
                        {n.msg}
                    </div>
                )}
            </For>
        </div>
    )
}
