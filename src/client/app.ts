import Vue from 'vue';
import Router from 'vue-router';
import router from './router';

Vue.use(Router);

const app = new Vue({
    render: h => h('router-view'),
    router,
});
app.$mount('#app');
