<div class="container grid-sm">
    <div class="columns">
        <div class="column col-12">
            <h1 class="d-inline-block">feedbox</h1>
            <span class="chip">{email}</span>
        </div>
        <div class="column col-12"><div class="divider"></div></div>

        <div class="column col-12">
            <div class="input-group">
                <input
                    class="form-input"
                    type="text"
                    placeholder="feed url"
                    bind:value="url"
                    />
                <button
                    type="button"
                    class="btn btn-primary input-group-btn"
                    class:loading="addLoading"
                    class:disabled="addLoading"
                    on:click="add(url)"
                    >
                    add
                </button>
            </div>
        </div>
        <div class="column col-12"><div class="divider"></div></div>

        {#each feeds as feed (feed.id)}
        <div class="column col-12">
            <div class="tile">
                <div class="tile-content">
                    <div class="tile-title text-break">
                        <a target="_blank" rel="noopener" href="{feed.url}">
                            {feed.url}
                        </a>
                    </div>
                    <div class="tile-subtitle text-gray">
                        <span>updated @ {format(feed.lastUpdated)}</span>
                    </div>
                </div>
                <div class="tile-action">
                    <div>
                        <button
                            type="button"
                            class="btn btn-error"
                            class:loading="feed.loading"
                            class:disabled="feed.loading"
                            on:click="del(feed)"
                            >
                            delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="column col-12"><div class="divider"></div></div>
        {/each}
    </div>
</div>

<script>
import dayjs from "dayjs";
import * as agent from "./agent.js";

export default {
    data() {
        return {
            addLoading: false,
            url: "",
            email: "",
            feeds: [],
        };
    },
    async oncreate() {
        Promise.all([
            agent.get("/api/v1/user", {
                "X-SW-STRATEGY": "staleWhileRevalidate",
            }),
            agent.get("/api/v1/feeds", {
                "X-SW-STRATEGY": "staleWhileRevalidate",
            }),
        ]).then(([user, feeds]) => {
            this.set({ email: user.email, feeds: feeds });
        });
    },
    helpers: {
        format(date, fmt = "YYYY-MM-DD HH:mm:ss") {
            if (date) {
                return dayjs(date).format(fmt);
            } else {
                return "unknown";
            }
        },
    },
    methods: {
        async del(feed) {
            const c = window.confirm(`DELETE "${feed.url}"`);
            if (!c) return;
            feed.loading = true;
            this.set({ feeds: this.get().feeds });
            agent
                .del(
                    "/api/v1/feeds/remove",
                    { feedId: feed.id },
                    {
                        "X-SW-STRATEGY": "networkOnly",
                        "X-SW-ACTION": `update;${process.env.API}/api/v1/feeds`,
                    },
                )
                .then(feeds => this.set({ feeds }))
                .catch(err => alert(err.message));
        },
        async add(url) {
            this.set({ addLoading: true });
            const feeds = await agent.put(
                "/api/v1/feeds/add",
                { url },
                {
                    "X-SW-STRATEGY": "networkOnly",
                    "X-SW-ACTION": `update;${process.env.API}/api/v1/feeds`,
                },
            );
            this.set({ addLoading: false, url: "", feeds });
        },
    },
};
</script>
