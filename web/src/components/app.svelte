{#if $user}
<h1>Hello {$user.email}</h1>

<ul>
    {#each $feeds as feed}
    <li>
        <p>url: {feed.url}</p>
        <p>lastUpdated: {feed.lastUpdated}</p>
        <button class="pure-button" on:click="del(feed)">delete</button>
    </li>
    {:else}
    <li>No feeds :(</li>
    {/each}
</ul>
{/if}

<script>
import * as agent from "../agent.js";

export default {
    async oncreate() {
        const user = await agent.get("/api/v1/user");
        this.store.set({ user });
    },
    methods: {
        async del(feed) {
            const c = window.confirm(`Do you confirm?`);
            if (c) {
                const feeds = await agent.del("/api/v1/feeds/remove", {
                    feedId: feed.id,
                });
                console.log(feeds);
            }
        },
        async add(url) {
            const feeds = await agent.put("/api/v1/feeds/add", { url });
            console.log(feeds);
        },
    },
};
</script>
