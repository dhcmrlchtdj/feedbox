import { Store } from "svelte/store.js";

const store = new Store({
    user: null,
});

store.compute("feeds", ["user"], user => {
    if (user) {
        return user.feeds;
    } else {
        return [];
    }
});

if (process.env.NODE_ENV !== "production") {
    window.store = store;
}

export default store;
