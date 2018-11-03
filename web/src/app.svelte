<div class="container grid-sm">
    {#if loading}
    <div class="columns">
        <div class="column col-12">
            <button class="btn btn-link loading"></button>
        </div>
    </div>
    {:else}
    <div class="columns" transition:fade>
        <div class="column col-12">
            <h1 class="d-inline-block">feedbox</h1>
            <span class="chip">{email}</span>
        </div>
        <div class="column col-12"><div class="divider"></div></div>

        <div class="column col-12">
            <div class="input-group">
                <input type="text" class="form-input" placeholder="feed url" bind:value="url">
                <button type="button" class="btn btn-primary input-group-btn"
                    class:loading="addLoading"
                    class:disabled="addLoading"
                    on:click="add(url)">add</button>
            </div>
        </div>
        <div class="column col-12"><div class="divider"></div></div>

        {#each feeds as feed (feed.id)}
        <div class="column col-12" transition:slide>
            <div class="tile">
                <div class="tile-content">
                    <div class="tile-title text-break"><a target="_blank" rel="noopener" href="{feed.url}">{feed.url}</a></div>
                    <div class="tile-subtitle text-gray"><span>updated @ {format(feed.lastUpdated)}</span></div>
                </div>
                <div class="tile-action">
                    <div><button type="button" class="btn btn-error"
                        class:loading="feed.loading"
                        class:disabled="feed.loading"
                        on:click="del(feed)">delete</button></div>
                </div>
            </div>
        </div>
        <div class="column col-12"><div class="divider"></div></div>
        {/each}
    </div>
    {/if}
</div>

<script>
import dayjs from "dayjs";
import { fade, slide } from "svelte-transitions";
import * as agent from "./agent.js";

export default {
    transitions: { fade, slide },
    data() {
        return {
            loading: true,
            addLoading: false,
            feeds: [],
            email: "",
            url: "",
        };
    },
    async oncreate() {
        const user = await agent.get("/api/v1/user");
        this.set({ loading: false, email: user.email, feeds: user.feeds });
    },
    helpers: {
        format(date, fmt = "YYYY-MM-DD HH:mm:ss") {
            if (date) {
                return dayjs(date).format(fmt);
            } else {
            return 'unknown'
        }
        },
    },
    methods: {
        async del(feed) {
            const c = window.confirm(`DELETE "${feed.url}"`);
            if (c) {
                feed.loading = true;
                this.set({ feeds: this.get().feeds });
                agent.del("/api/v1/feeds/remove", { feedId: feed.id })
                    .then(feeds => this.set({ feeds }))
                    .catch(err => alert(err.message));
            }
        },
        async add(url) {
            this.set({ addLoading: true });
            const feeds = await agent.put("/api/v1/feeds/add", { url });
            this.set({ addLoading: false, url: "", feeds });
        },
    },
};
</script>
