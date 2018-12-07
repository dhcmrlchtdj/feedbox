import dayjs from "dayjs";
import { fade, slide } from "svelte-transitions";
import * as agent from "./agent.js";

export default {
    transitions: { fade, slide },
    data() {
        return {
            loading: true,
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
            this.set({ loading: false, email: user.email, feeds: feeds });
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
