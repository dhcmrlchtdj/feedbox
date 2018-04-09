<template>
    <section>
        <p>hello {{email}}</p>
        <ul v-for="feed in feeds">
            <li>{{feed.title}}</li>
        </ul>


    <form @submit.prevent.stop="addFeed">
        <label>
            <span>feed</span>
            <input type="text" required v-model="feed">
        </label>
        <button type="submit">添加</button>
    </form>

    </section>
</template>

<script>
import axios from 'axios';

export default {
    data() {
        return {
            email: '',
            feeds: [],
            feed: '',
        };
    },
    methods: {
        addFeed() {
            console.log(this.feed);
            axios.put('/v1/user/feed/add', {
                feed: this.feed,
            });
        },
    },
    beforeRouteEnter(to, from, next) {
        axios('/v1/user/info')
            .then(({ data }) => {
                const { email } = data;
                if (email) {
                    next(vm => {
                        vm.email = email;
                    });
                } else {
                    throw new Error('403');
                }
            })
            .catch(err => {
                next('/login');
            });
    },
    mounted() {
        axios('/v1/user/feeds').then(({ data }) => {
            const { feeds } = data;
            this.feeds = feeds;
        });
    },
};
</script>
