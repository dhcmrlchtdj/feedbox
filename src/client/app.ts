import Vue from 'vue';
import Router from 'vue-router';
import router from './router';

Vue.config.productionTip = false;
Vue.config.performance = true;
Vue.use(Router);

const app = new Vue({
    render: h => h('router-view'),
    router,
});
app.$mount('#app');
