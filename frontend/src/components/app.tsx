import type { Component } from 'solid-js'
import { onMount, Suspense, ErrorBoundary } from 'solid-js'
import { Add } from './add'
import { Auth } from './auth'
import { Heading } from './heading'
import { List } from './list'
import { Notify } from './notify'
import { Feed, setState } from '../state'
import * as agent from '../utils/agent'

const Loading: Component = () => {
    return (
        <div class="columns">
            <div class="column col-12">
                <div class="loading loading-lg"></div>
            </div>
        </div>
    )
}

const Body: Component = () => {
    onMount(() => {
        Promise.all([agent.get(`/api/v1/user`), agent.get(`/api/v1/feeds`)])
            .then(([user, resp]) => {
                setState({
                    email: user.addition.email,
                    feeds: resp,
                    initialized: true,
                })
            })
            .catch((err) => {
                setState('initialized', true)
                throw err
            })
    })

    return (
        <>
            <div class="columns">
                <Heading />
                <Add />
                <List />
            </div>
            <Notify />
        </>
    )
}

export const App: Component<{ email?: string; feeds?: Feed[] }> = (props) => {
    const email = props.email ?? ''
    const feeds = props.feeds ?? []
    if (email) setState('email', email)
    if (feeds.length) setState('feeds', feeds)
    return (
        <div class="container grid-sm">
            <ErrorBoundary fallback={(err) => <Auth err={err} />}>
                <Suspense fallback={<Loading />}>
                    <Body />
                </Suspense>
            </ErrorBoundary>
        </div>
    )
}
