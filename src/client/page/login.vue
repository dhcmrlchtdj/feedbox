<template>
    <form @submit.prevent.stop="submitEmail">
        <label>
            <span>email</span>
            <input type="email" required v-model="email">
        </label>
        <button type="submit">登录</button>
    </form>
</template>

<script lang="ts">
import axios from 'axios';

export default {
    data() {
        return {
            email: '',
        };
    },
    methods: {
        submitEmail(evt) {
            axios
                .post('/v1/login', {
                    email: this.email,
                })
                .then(resp => {
                    console.log(resp);
                    alert(resp);
                })
                .catch(err => {
                    console.log(err);
                    alert(err.message);
                });
        },
    },
};
</script>
