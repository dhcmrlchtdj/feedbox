<template>
    <p>hello {{email}}</p>
</template>

<script lang="ts">
import axios from 'axios';

export default {
    data() {
        return {
            email: '',
            feeds: null,
        };
    },
    beforeRouteEnter(to, from, next) {
        axios('/v1/user/info')
            .then(({data}) => {
            const {email} = data;
                if (email) {
                    next(vm => {
                        vm.email = email;
                    });
                } else {
                    throw new Error('403');
                }
            })
            .catch((err) => {
                next('/login');
            });
    },
    mounted() {
        axios('/v1/user/feeds').then(({data}) => {
        const {feeds} = data;
        this.feeds = feeds;
        console.log(feeds);
        });
    }
};
</script>
