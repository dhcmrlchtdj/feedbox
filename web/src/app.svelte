<div class="container grid-sm">
    <div class="columns">
        {#if email}
        <div class="column col-12">
            <h1 class="d-inline-block">feedbox</h1>
            <span class="chip">{email}</span>
        </div>
        <div class="column col-12"><div class="divider"></div></div>

        <div class="column col-12">
            <div class="input-group">
                <input type="text" class="form-input" placeholder="feed url" bind:value="url">
                <button type="button" class="btn btn-primary input-group-btn" on:click="add(url)">add</button>
            </div>
        </div>
        <div class="column col-12"><div class="divider"></div></div>

        {#each feeds as feed (feed.id)}
        <div class="column col-12">
            <div class="tile">
                <div class="tile-content">
                    <div class="tile-title text-break"><span>{feed.url}</span></div>
                    <div class="tile-subtitle text-gray"><span>updated @ {format(feed.lastUpdated)}</span></div>
                </div>
                <div class="tile-action">
                    <div><button type="button" class="btn btn-error" on:click="del(feed)">delete</button></div>
                </div>
            </div>
        </div>
        <div class="column col-12"><div class="divider"></div></div>
        {:else}
        <p>No feeds :(</p>
        {/each}
        {/if}
    </div>
</div>

<script>
import * as agent from "./agent.js";
import dayjs from "dayjs";

export default {
    data() {
        return {
            feeds: [],
            email: "",
            url: "",
        };
    },
    async oncreate() {
        const user = await agent.get("/api/v1/user");
        this.set({ email: user.email, feeds: user.feeds });
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
            const c = window.confirm(`Do you confirm?`);
            if (c) {
                const feeds = await agent.del("/api/v1/feeds/remove", {
                    feedId: feed.id,
                });
                this.set({ feeds });
            }
        },
        async add(url) {
            const feeds = await agent.put("/api/v1/feeds/add", { url });
            this.set({ url: "", feeds });
        },
    },
};
</script>
